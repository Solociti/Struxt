import { useCallback, useRef, useState } from "react";
import { buildDefaultCollapsed, buildDefaultHeights } from "./sectionRegistry";

const storageKey = "asset-sidebar";

export interface SidebarStoredState {
  width: number;
  heights: number[];
  collapsed: boolean[];
}

export const defaultSidebarWidth = 250;

function makeDefaultState(): SidebarStoredState {
  return {
    width: defaultSidebarWidth,
    heights: buildDefaultHeights(),
    collapsed: buildDefaultCollapsed(),
  };
}

/**
 * Reads stored sidebar state from localStorage.
 * Returns defaults if data is missing, corrupted, or has incompatible array lengths.
 */
function readStore(): SidebarStoredState {
  const defaults = makeDefaultState();
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        Array.isArray(parsed.heights) &&
        parsed.heights.length === defaults.heights.length &&
        Array.isArray(parsed.collapsed) &&
        parsed.collapsed.length === defaults.collapsed.length
      ) {
        return { ...defaults, ...parsed };
      }
    }
  } catch {}
  return defaults;
}

let storeTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Writes sidebar state to localStorage after a 500ms debounce.
 *
 * @param state
 */
function debounceWrite(state: SidebarStoredState): void {
  if (storeTimeout) {
    clearTimeout(storeTimeout);
  }
  storeTimeout = setTimeout(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    storeTimeout = null;
  }, 500);
}

/**
 * Manages persistent sidebar layout state (width, heights, collapsed).
 */
export function useSidebarState() {
  const [store, setStore] = useState<SidebarStoredState>(readStore);
  const storeRef = useRef(store);
  storeRef.current = store;

  const patchStore = useCallback((patch: Partial<SidebarStoredState>) => {
    const next = { ...storeRef.current, ...patch };
    setStore(next);
    debounceWrite(next);
  }, []);

  const toggleCollapse = useCallback(
    (index: number) => {
      const next = [...storeRef.current.collapsed];
      next[index] = !next[index];
      patchStore({ collapsed: next });
    },
    [patchStore],
  );

  const resetHeights = useCallback(() => {
    patchStore({ heights: buildDefaultHeights() });
  }, [patchStore]);

  return {
    store,
    storeRef,
    patchStore,
    toggleCollapse,
    resetHeights,
  };
}
