import { useLoadAsync } from "client/api/useLoadAsync";
import { addToastError } from "client/components/ErrorSnackBar";
import { useCurrentProject } from "client/projects/ProjectContext";
import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import {
  FileType,
  getFileExtension,
  getFileType,
} from "common/models/assets/FileExtensions";
import { ProjectListItem } from "common/models/projects/ProjectItem";
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
  getTextAssetContents,
  saveAssetContent,
} from "../assetApis";

interface Tab {
  item: AssetListItem;
  type: FileType;

  asset: AssetModel | null;
  hasAssetLoaded: boolean;
  isAssetLoading: boolean;
  assetLoadError: Error | null;

  isActive: boolean;
  isDirty: boolean;

  content: string;
  hasContentLoaded: boolean;
  isContentLoading: boolean;
  contentLoadError: Error | null;
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

    content: "",
    hasContentLoaded: false,
    isContentLoading: true,
    contentLoadError: null,
  };
}

interface ContentManagerState {
  project: ProjectListItem;
  isSingleProject: boolean;

  assets: {
    list: AssetListItem[];
    loading: boolean;
    error: Error | null;
    saveTextAsset(uuid: string, content: string): Promise<void>;
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

function useContentManagerState(): ContentManagerState {
  const { project, isSingleProject } = useCurrentProject();
  const projectId = project.projectId;

  // Load and keep track of the list of assets
  const {
    response: assetList,
    isLoading: loadingList,
    error: listError,
  } = useLoadAsync(async () => {
    if (!isSingleProject) {
      return null;
    }

    return await getAssetList(projectId);
  }, [projectId]);

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

  const _loadingContent = useRef(new Set<string>());
  const loadContentForTab = useCallback(
    (item: AssetListItem) => {
      if (_loadingContent.current.has(item.uuid)) {
        return;
      }
      _loadingContent.current.add(item.uuid);

      getTextAssetContents(projectId, item)
        .then((content) => {
          updateTabState(item.uuid, {
            content,
            isContentLoading: false,
            hasContentLoaded: true,
            contentLoadError: null,
          });
          _loadingContent.current.delete(item.uuid);
        })
        .catch((err) => {
          updateTabState(item.uuid, {
            content: "",
            hasContentLoaded: true,
            isContentLoading: false,
            contentLoadError: err,
          });
          _loadingContent.current.delete(item.uuid);
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

      if (
        tab.type === "text" &&
        !tab.item.isExternalSrc &&
        !tab.hasContentLoaded
      ) {
        loadContentForTab(tab.item);
      }
    };

    // Always load for the active tab immediately
    if (activeTab) {
      loadTab(activeTab);
    }
  }, [
    projectId,
    activeTab,
    tabs,
    updateTabState,
    loadAssetForTab,
    loadContentForTab,
  ]);

  return {
    project,
    isSingleProject,
    assets: {
      list: assetList || [],
      loading: loadingList,
      error: listError,
      async saveTextAsset(uuid: string, content: string) {
        updateTabState(uuid, {
          content,
          isDirty: true,
        });

        try {
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
        // check if the item is already open
        if (tabs.find((t) => t.item.uuid === item.uuid)) {
          setActiveTab(item.uuid);
          return;
        }

        const tab = createNewTab(item);
        tab.isActive = true;

        setTabs((tabs) => {
          for (const tab of tabs) {
            tab.isActive = false;
          }

          return [...tabs, tab];
        });
      },
      removeTab: (uuid: string) => {
        setTabs((tabs) => {
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
