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
import { TriggerSettingsTabState } from "../triggers/TriggerSettings";

export type NoneFileTabType = "settings:triggers";

export type TabType = FileType | NoneFileTabType;

interface Tab {
  type: TabType;

  /**
   * For file tabs, this is the asset being edited.
   *
   * for non-file tabs, the type of tab that is open. Prevents multiple settings tabs open at once, etc.
   */
  tabId: string;

  name: string;

  isActive: boolean;
  isDirty: boolean;

  /**
   * Store a arbitrary state for the tab.
   * Useful for storing unsaved changes.
   *
   * This will be cleared when the tab is closed.
   */
  state?: unknown;
}

export interface FileTab extends Tab {
  item: AssetListItem;
  type: FileType;

  asset: AssetModel | null;
  hasAssetLoaded: boolean;
  isAssetLoading: boolean;
  assetLoadError: Error | null;
}

/**
 * Type guard to determine if a given tab is a file tab or a non-file tab.
 *
 * @param tab
 * @returns
 */
export function isFileTab(tab: Tab | FileTab): tab is FileTab {
  return "item" in tab;
}

/**
 * Factory for creating a new tab object based on the type of tab to be opened.
 *
 * @param type
 * @returns
 */
function createNewTab(type: NoneFileTabType): Tab {
  return {
    tabId: type,
    type,
    name: type === "settings:triggers" ? "Entrypoints" : type,
    isActive: false,
    isDirty: false,
  };
}

/**
 * Factory for creating a new file tab object based on the asset to be edited.
 *
 * @param item
 * @returns
 */
function createNewFileTab(item: AssetListItem): FileTab {
  const type = getFileType(getFileExtension(item.path));

  return {
    tabId: item.uuid,
    name: "",

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
    list: (Tab | FileTab)[];
    setActiveTab: (tabId: string) => void;
    activeTab: Tab | FileTab | null;
    addTab: (item: NoneFileTabType | AssetListItem) => void;
    removeTab: (tabId: string) => void;
    markDirty(tabId: string): void;
    markClean(tabId: string): void;
    useState<S>(
      tabId: string | undefined,
      initialState?: S,
    ): [S | undefined, (val: S | ((prev: S) => S)) => void];
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
  const [tabs, setTabs] = useState<(Tab | FileTab)[]>([]);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  const updateTabState = useCallback(
    (tabId: string, tab: Partial<Tab> | Partial<FileTab>) => {
      setTabs((tabs) =>
        tabs.map((t) => {
          if (t.tabId === tabId) {
            return { ...t, ...tab };
          }
          return t;
        }),
      );
    },
    [],
  );

  const setActiveTab = useCallback((tabId: string) => {
    setTabs((tabs) =>
      tabs.map((tab) => ({ ...tab, isActive: tab.tabId === tabId })),
    );
  }, []);

  const activeTab = tabs.find((t) => t.isActive) || null;

  useEffect(() => {
    const unregister = commands.on("rename", (result) => {
      // update any open tabs with the new path
      setTabs((tabs) =>
        tabs.map((tab) => {
          // only run this for file tabs
          if (!isFileTab(tab)) {
            return tab;
          }

          const asset = result.completed.find((i) => i.uuid === tab.tabId);
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

    const loadTab = (tab: FileTab) => {
      if (!tab.hasAssetLoaded) {
        loadAssetForTab(tab.item.uuid);
      }
    };

    // Always load for the active tab immediately
    if (activeTab && isFileTab(activeTab)) {
      loadTab(activeTab);
    }
  }, [projectId, activeTab, tabs, updateTabState, loadAssetForTab]);

  useEffect(() => {
    const unregister: Function[] = [];

    unregister.push(
      commands.on("tabs:open", (item) => {
        if (typeof item === "string") {
          // handle non-file tabs
          setTabs((tabs) => {
            // check if the tab is already open
            if (tabs.find((t) => t.tabId === item)) {
              setActiveTab(item);
              return tabs;
            }

            const tab = createNewTab(item);
            tab.isActive = true;

            for (const tab of tabs) {
              tab.isActive = false;
            }

            return [...tabs, tab];
          });
        } else {
          commands.trigger("tabs:open:file", item);
        }
      }),
    );

    unregister.push(
      commands.on("tabs:open:file", (item) => {
        setTabs((tabs) => {
          // check if the item is already open
          if (tabs.find((t) => t.tabId === item.uuid)) {
            setActiveTab(item.uuid);
            return tabs;
          }

          const tab = createNewFileTab(item);
          tab.isActive = true;

          for (const tab of tabs) {
            tab.isActive = false;
          }

          return [...tabs, tab];
        });
      }),
    );

    unregister.push(
      commands.on("tabs:close", (tabId) => {
        setTabs((tabs) => {
          const activeTab = tabs.find((t) => t.isActive) || null;
          let wasActive = activeTab?.tabId === tabId;
          let index = -1;

          tabs = tabs.filter((tab, i) => {
            if (tab.tabId === tabId) {
              index = i;
              return false;
            }
            return true;
          });

          if (wasActive && tabs.length > 0) {
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

  // listen for add trigger command, and open the triggers tab if it's not already open
  useEffect(() => {
    const isTabReady = () => {
      const activeTab = tabsRef.current.find(
        (t) => t.tabId === "settings:triggers",
      );

      return Boolean(
        activeTab && (activeTab.state as TriggerSettingsTabState)?.ready,
      );
    };

    return commands.on("settings:triggers:add", (data) => {
      let count = 0;
      commands.trigger("tabs:open", "settings:triggers");

      let iId = setInterval(() => {
        count++;
        if (isTabReady()) {
          clearInterval(iId);
          commands.trigger("settings:triggers:add:internal", data);
        }

        if (count > 50) {
          clearInterval(iId);
          addToastError(new Error("Failed to open triggers tab"));
        }
      }, 50);
    });
  }, [commands]);

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
      addTab: (item: NoneFileTabType | AssetListItem) => {
        commands.trigger("tabs:open", item);
      },
      removeTab: (tabId: string) => {
        commands.trigger("tabs:close", tabId);
      },
      markDirty(tabId: string) {
        updateTabState(tabId, { isDirty: true });
      },
      markClean(tabId: string) {
        updateTabState(tabId, { isDirty: false });
      },
      useState<S>(
        tabId: string | undefined,
        initialState?: S,
      ): [S | undefined, (val: S | ((prev: S) => S)) => void] {
        const initialRef = useRef(initialState);
        useEffect(() => {
          initialRef.current = initialState;
        }, [tabId]);

        const tab = tabs.find((t) => t.tabId === tabId);

        const currentVal = tabId
          ? (tab?.state ?? initialRef.current)
          : undefined;

        const setState = useCallback(
          (newState: S | ((prev: S) => S)) => {
            if (!tabId) {
              return;
            }

            setTabs((prevTabs) =>
              prevTabs.map((t) => {
                if (t.tabId !== tabId) {
                  return t;
                }

                const prevValue = t.state ?? initialRef.current;
                const nextValue =
                  typeof newState === "function"
                    ? (newState as any)(prevValue)
                    : newState;
                return { ...t, state: nextValue };
              }),
            );
          },
          [tabId],
        );

        // Sync initial state to the store if it's missing
        useEffect(() => {
          if (
            tabId &&
            tab &&
            typeof tab.state === "undefined" &&
            typeof initialRef.current !== "undefined"
          ) {
            setState(initialRef.current);
          }
        }, [tabId, tab, setState]);

        return [currentVal as S, setState];
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
