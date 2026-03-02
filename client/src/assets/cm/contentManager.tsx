import { useLoadAsync } from "client/api/useLoadAsync";
import { addToastError } from "client/components/ErrorSnackBar";
import { useCurrentProject } from "client/projects/ProjectContext";
import { getProjectDetails } from "client/projects/projects";
import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { ProjectListItem } from "common/models/projects/ProjectItem";
import {
  FileType,
  getFileExtension,
  getFileType,
} from "common/path/FileExtensions";
import { dirname } from "common/path/path";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getAsset,
  getAssetList,
  moveAssets,
  saveAssetContent,
} from "../assetApis";
import { CommandManager, useCommandManager } from "./CommandManager";

interface Tab {
  item: AssetListItem;
  type: FileType;

  asset: AssetModel | null;
  hasAssetLoaded: boolean;
  isAssetLoading: boolean;
  assetLoadError: Error | null;

  isActive: boolean;
  isDirty: boolean;
}

function createNewTab(item: AssetListItem): Tab {
  const type = getFileType(getFileExtension(item.path));

  return {
    item,
    type,

    asset: null,
    hasAssetLoaded: false,
    assetLoadError: null,
    isAssetLoading: true,

    isActive: false,
    isDirty: false,
  };
}

interface ContentManagerState {
  project: ProjectListItem;
  isSingleProject: boolean;

  projectDetails: {
    data: ProjectDetails | null;
    loading: boolean;
    error: Error | null;
  };

  assets: {
    list: AssetListItem[];
    loading: boolean;
    error: Error | null;
    saveTextAsset(uuid: string, content: string): Promise<void>;
  };

  commands: CommandManager;

  clipboard: {
    state: null | {
      items: AssetListItem[];
      basePath: string;
    };
  };

  tabs: {
    list: Tab[];
    setActiveTab: (uuid: string) => void;
    activeTab: Tab | null;
    addTab: (item: AssetListItem) => void;
    removeTab: (uuid: string) => void;
    markDirty(uuid: string): void;
  };
}

// TODO: setup listeners for project changes from the server

function useContentManagerState(): ContentManagerState {
  const { project, isSingleProject } = useCurrentProject();
  const projectId = project.projectId;

  const commands = useCommandManager();

  // load project details
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(
    null,
  );
  useEffect(() => {
    return commands.on("update:project-details", (details) => {
      setProjectDetails(details);
    });
  }, [commands]);
  const { isLoading: projectDetailsLoading, error: projectDetailsError } =
    useLoadAsync(async () => {
      if (!isSingleProject) {
        return null;
      }

      const details = await getProjectDetails(projectId);
      commands.trigger("update:project-details", details);
      return null;
    }, [projectId]);

  // Load and keep track of the list of assets
  const {
    response: assetList,
    isLoading: loadingList,
    error: listError,
    reload: reloadAssetList,
  } = useLoadAsync(async () => {
    if (!isSingleProject) {
      return null;
    }

    return await getAssetList(projectId);
  }, [projectId]);

  // listen for events that would trigger a reload of the list
  useEffect(() => {
    const unregister: Function[] = [];

    unregister.push(
      commands.on("new-asset", () => {
        reloadAssetList();
      }),
    );
    unregister.push(
      commands.on("delete", () => {
        reloadAssetList();
      }),
    );
    unregister.push(
      commands.on("restore", () => {
        reloadAssetList();
      }),
    );
    unregister.push(
      commands.on("rename", () => {
        reloadAssetList();
      }),
    );
    unregister.push(
      commands.on("move", () => {
        reloadAssetList();
      }),
    );
    unregister.push(
      commands.on("paste", () => {
        reloadAssetList();
      }),
    );
    unregister.push(
      commands.on("upload", () => {
        reloadAssetList();
      }),
    );

    return () => {
      unregister.forEach((cb) => cb());
    };
  }, [reloadAssetList]);

  // Keep track of the open editor tabs
  const [tabs, setTabs] = useState<Tab[]>([]);

  const updateTabState = useCallback((uuid: string, tab: Partial<Tab>) => {
    setTabs((tabs) =>
      tabs.map((t) => {
        if (t.item.uuid === uuid) {
          return { ...t, ...tab };
        }
        return t;
      }),
    );
  }, []);

  const setActiveTab = useCallback((uuid: string) => {
    setTabs((tabs) => {
      for (const tab of tabs) {
        tab.isActive = tab.item.uuid === uuid;
      }
      return tabs.slice();
    });
  }, []);

  const activeTab = tabs.find((t) => t.isActive) || null;

  useEffect(() => {
    const unregister = commands.on("rename", (result) => {
      // update any open tabs with the new path
      setTabs((tabs) =>
        tabs.map((tab) => {
          const asset = result.completed.find((i) => i.uuid === tab.item.uuid);
          if (asset) {
            return {
              ...tab,
              item: asset.getListItem(),
              asset,
            };
          }
          return tab;
        }),
      );
    });

    return unregister;
  }, []);

  // handle loading the assets and content for all tabs in the background
  const _loadingAssets = useRef(new Set<string>());
  const loadAssetForTab = useCallback(
    (uuid: string) => {
      if (_loadingAssets.current.has(uuid)) {
        return;
      }
      _loadingAssets.current.add(uuid);

      getAsset(projectId, uuid)
        .then((asset) => {
          updateTabState(uuid, {
            asset,
            isAssetLoading: false,
            assetLoadError: null,
            hasAssetLoaded: true,
          });
          _loadingAssets.current.delete(uuid);
        })
        .catch((err) => {
          updateTabState(uuid, {
            asset: null,
            isAssetLoading: false,
            assetLoadError: err,
            hasAssetLoaded: true,
          });
          _loadingAssets.current.delete(uuid);
        });
    },
    [projectId, updateTabState],
  );

  useEffect(() => {
    if (!isSingleProject) {
      return;
    }

    const loadTab = (tab: Tab) => {
      if (!tab.hasAssetLoaded) {
        loadAssetForTab(tab.item.uuid);
      }
    };

    // Always load for the active tab immediately
    if (activeTab) {
      loadTab(activeTab);
    }
  }, [projectId, activeTab, tabs, updateTabState, loadAssetForTab]);

  useEffect(() => {
    const unregister: Function[] = [];

    unregister.push(
      commands.on("tabs:open", (item) => {
        setTabs((tabs) => {
          // check if the item is already open
          if (tabs.find((t) => t.item.uuid === item.uuid)) {
            setActiveTab(item.uuid);
            return tabs;
          }

          const tab = createNewTab(item);
          tab.isActive = true;

          for (const tab of tabs) {
            tab.isActive = false;
          }

          return [...tabs, tab];
        });
      }),
    );

    unregister.push(
      commands.on("tabs:close", (uuid) => {
        setTabs((tabs) => {
          const activeTab = tabs.find((t) => t.isActive) || null;
          let isActive = activeTab?.item.uuid === uuid;
          let index = -1;

          tabs = tabs.filter((tab, i) => {
            if (tab.item.uuid === uuid) {
              index = i;
              return false;
            }
            return true;
          });

          if (isActive && tabs.length > 0) {
            index = Math.max(0, Math.min(index, tabs.length - 1));
            if (tabs[index]) {
              tabs[index].isActive = true;
            }
          }

          return tabs;
        });
      }),
    );

    return () => {
      unregister.forEach((cb) => cb());
    };
  }, []);

  // setup asset clipboard system
  const [assetClipboard, setAssetClipboard] = useState<null | {
    basePath: string;
    items: AssetListItem[];
  }>(null);

  useEffect(() => {
    const unregister: Function[] = [];

    unregister.push(
      commands.on("copy", (path, items) => {
        setAssetClipboard({
          basePath: path,
          items,
        });
      }),
    );

    return () => {
      unregister.forEach((cb) => cb());
    };
  }, [commands]);

  useEffect(() => {
    return commands.on("paste:trigger", async (destination) => {
      if (!assetClipboard) {
        return;
      }

      // create copies of all items in the clipboard in the new location
      const { basePath, items } = assetClipboard;
      const srcPath = dirname(basePath);

      // Get the directory where the asset will be copied into.
      const isDestDir = "files" in destination;
      const destPath = isDestDir ? destination.path : dirname(destination.path);

      const result = await moveAssets(
        projectId,
        items.map((i) => ({ uuid: i.uuid })),
        srcPath,
        destPath,
        "rename",
        "copy",
      );

      commands.trigger("paste", result);
    });
  }, [commands, assetClipboard, projectId]);

  return {
    commands,
    project,
    isSingleProject,
    projectDetails: {
      data: projectDetails ?? null,
      loading: projectDetailsLoading,
      error: projectDetailsError,
    },
    clipboard: {
      state: assetClipboard,
    },
    assets: {
      list: assetList || [],
      loading: loadingList,
      error: listError,
      async saveTextAsset(uuid: string, content: string) {
        updateTabState(uuid, {
          isDirty: true,
        });

        try {
          // handing the file name to the save method, creates issues with json mime types.
          // so we are handling everything as text/plain

          await saveAssetContent(projectId, uuid, content);
          updateTabState(uuid, { isDirty: false });
        } catch (err) {
          // show the save error
          addToastError(err as Error);
        }
      },
    },

    tabs: {
      list: tabs,
      setActiveTab,
      activeTab,
      addTab: (item: AssetListItem) => {
        commands.trigger("tabs:open", item);
      },
      removeTab: (uuid: string) => {
        commands.trigger("tabs:close", uuid);
      },
      markDirty(uuid: string) {
        updateTabState(uuid, { isDirty: true });
      },
    },
  };
}

const ContentManagerContext = createContext<
  ReturnType<typeof useContentManagerState> | undefined
>(undefined);

export function ContentManagerProvider({ children }: { children: ReactNode }) {
  const value = useContentManagerState();

  return (
    <ContentManagerContext.Provider value={value}>
      {children}
    </ContentManagerContext.Provider>
  );
}

export function useContentManager() {
  const context = useContext(ContentManagerContext);
  if (context === undefined) {
    throw new Error(
      "useContentManager must be used within a ContentManagerProvider",
    );
  }
  return context;
}
