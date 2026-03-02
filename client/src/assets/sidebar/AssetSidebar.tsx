import MaterialIcon from "client/components/MaterialIcon";
import { ReactNode, useCallback, useRef, useState } from "react";
import { AssetFileSection } from "./AssetFileSection";
import { EnvironmentSection } from "./EnvironmentSection";
import { RoutineEnvSection } from "./RoutineEnvSection";

const storageKey = "asset-sidebar";

const headerHeight = 28;
const dragHandleHeight = 4;
const minSectionHeight = 60;

interface SidebarStoredState {
  width: number;
  heights: [number, number];
  collapsed: [boolean, boolean, boolean];
}

const defaultStoredState: SidebarStoredState = {
  width: 250,
  heights: [150, 150],
  collapsed: [false, true, false],
};

/**
 * Reads the full sidebar state from localStorage.
 */
function readStore(): SidebarStoredState {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return { ...defaultStoredState, ...JSON.parse(stored) };
    }
  } catch {}
  return { ...defaultStoredState };
}

let storeTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounces writing the full sidebar state to localStorage.
 *
 * @param state
 */
function debounceWrite(state: SidebarStoredState) {
  if (storeTimeout) {
    clearTimeout(storeTimeout);
  }
  storeTimeout = setTimeout(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    storeTimeout = null;
  }, 500);
}

type ActiveDragKind = "width" | "height";

interface WidthDrag {
  kind: "width";
  startX: number;
  startWidth: number;
}

interface HeightDrag {
  kind: "height";
  startY: number;
  handleIdx: number;
  startHeights: [number, number];
}

type ActiveDrag = WidthDrag | HeightDrag;

interface SectionDef {
  title: string;
  content: ReactNode;
}

/**
 * Renders the resizable sidebar with collapsible, height-resizable sections
 * for Assets, Environments, and Routine Environments.
 */
export function AssetSidebar() {
  const [store, setStore] = useState<SidebarStoredState>(readStore);
  const storeRef = useRef(store);
  storeRef.current = store;

  const [activeDragKind, setActiveDragKind] = useState<ActiveDragKind | null>(
    null,
  );

  const dragRef = useRef<ActiveDrag | null>(null);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Merges a partial update into the store state and debounce-persists it.
   *
   * @param patch
   */
  const patchStore = useCallback((patch: Partial<SidebarStoredState>) => {
    const next = { ...storeRef.current, ...patch };
    setStore(next);
    debounceWrite(next);
  }, []);

  const handleWidthDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      kind: "width",
      startX: e.clientX,
      startWidth: storeRef.current.width,
    };
  }, []);

  const handleHeightDragStart = useCallback(
    (e: React.MouseEvent, handleIdx: number) => {
      e.preventDefault();
      dragRef.current = {
        kind: "height",
        startY: e.clientY,
        handleIdx,
        startHeights: [...storeRef.current.heights] as [number, number],
      };
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current) {
        return;
      }

      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        setActiveDragKind(dragRef.current.kind);
      }

      if (dragRef.current.kind === "width") {
        const drag = dragRef.current;
        const newWidth = drag.startWidth + (e.clientX - drag.startX);
        const maxWidth = Math.max(
          window.innerWidth * 0.25,
          defaultStoredState.width * 1.5,
        );
        patchStore({ width: Math.max(100, Math.min(newWidth, maxWidth)) });
        return;
      }

      if (dragRef.current.kind === "height") {
        const { startY, handleIdx, startHeights } = dragRef.current;
        const deltaY = e.clientY - startY;
        const [h1Start, h2Start] = startHeights;

        const containerHeight =
          containerRef.current?.clientHeight ?? window.innerHeight;
        // minimum px the first (flex) section must retain
        const minFirstHeight = Math.max(150, window.innerHeight * 0.1);
        // max combined px h1+h2 can occupy before crowding out section 0
        const allHandleHeights = 2 * dragHandleHeight;
        const maxTotal = containerHeight - allHandleHeights - minFirstHeight;

        let h1: number;
        let h2: number;

        if (handleIdx === 0) {
          if (storeRef.current.collapsed[1]) {
            // h1 is collapsed — redirect resize to h2 instead
            h1 = h1Start;
            h2 = Math.max(
              minSectionHeight,
              Math.min(maxTotal - headerHeight, h2Start - deltaY),
            );
          } else {
            h1 = h1Start - deltaY;
            h2 = h2Start;

            // clamp h1 so h1+h2 never exceeds maxTotal (protects section 0's min height)
            h1 = Math.min(h1, maxTotal - h2);

            if (h1 < minSectionHeight) {
              // h1 hit its floor — shove overflow into h2
              const overflow = minSectionHeight - h1;
              h1 = minSectionHeight;
              h2 = Math.max(minSectionHeight, h2Start - overflow);
            }
          }
        } else {
          // redistribute h1/h2 at a fixed total; when either hits its floor, steal from Assets
          h1 = h1Start + deltaY;
          h2 = h1Start + h2Start - h1;

          if (h1 < minSectionHeight) {
            // h1 floored — h2 keeps growing by stealing from Assets
            h1 = minSectionHeight;
            h2 = Math.min(maxTotal - minSectionHeight, h2Start - deltaY);
          } else if (h2 < minSectionHeight) {
            // h2 floored — clamp both, don't steal from Assets
            h2 = minSectionHeight;
            h1 = h1Start + h2Start - minSectionHeight;
          }

          // safety clamps
          h1 = Math.max(
            minSectionHeight,
            Math.min(maxTotal - minSectionHeight, h1),
          );
          h2 = Math.max(
            minSectionHeight,
            Math.min(maxTotal - minSectionHeight, h2),
          );
        }

        patchStore({ heights: [h1, h2] });
      }
    },
    [patchStore],
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    isDraggingRef.current = false;
    setActiveDragKind(null);
  }, []);

  const toggleCollapse = useCallback(
    (index: number) => {
      const next = [...storeRef.current.collapsed] as [
        boolean,
        boolean,
        boolean,
      ];
      next[index] = !next[index];
      patchStore({ collapsed: next });
    },
    [patchStore],
  );

  const resetHeights = useCallback(() => {
    patchStore({ heights: defaultStoredState.heights });
  }, [patchStore]);

  const { width, heights, collapsed } = store;
  const cursor = activeDragKind === "width" ? "col-resize" : "row-resize";

  const sections: SectionDef[] = [
    { title: "Assets", content: <AssetFileSection /> },
    {
      title: "Routine Environments",
      content: <RoutineEnvSection />,
    },
    { title: "Environments", content: <EnvironmentSection /> },
  ];

  return (
    <>
      {activeDragKind && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, cursor }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      )}

      <div
        ref={containerRef}
        style={{ width, minWidth: width, position: "relative", flexShrink: 0 }}
        className="h-100 border-end d-flex flex-column"
      >
        {sections.map((section, i) => {
          const isCollapsed = collapsed[i];
          const isLast = i === sections.length - 1;
          const isFirst = i === 0;

          return (
            <div key={section.title} style={{ display: "contents" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  ...(isFirst
                    ? { flex: 1, minHeight: headerHeight }
                    : {
                        height: isCollapsed ? headerHeight : heights[i - 1],
                        flexShrink: 0,
                        transition: activeDragKind
                          ? undefined
                          : "height 0.3s ease",
                      }),
                }}
              >
                <SectionHeader
                  title={section.title}
                  isCollapsed={isCollapsed}
                  onToggle={isFirst ? undefined : () => toggleCollapse(i)}
                />

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    minHeight: 0,
                    display: isCollapsed ? "none" : undefined,
                  }}
                >
                  {section.content}
                </div>
              </div>

              {!isLast && (
                <SectionDragHandle
                  isActive={
                    activeDragKind === "height" &&
                    (dragRef.current as HeightDrag | null)?.handleIdx === i
                  }
                  onMouseDown={(e) => handleHeightDragStart(e, i)}
                  onDoubleClick={resetHeights}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                />
              )}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 5,
            height: "100%",
            cursor: "col-resize",
            backgroundColor:
              activeDragKind === "width"
                ? "rgba(73, 80, 87, 0.4)"
                : "transparent",
          }}
          onMouseDown={handleWidthDragStart}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={() => patchStore({ width: defaultStoredState.width })}
        />
      </div>
    </>
  );
}

interface SectionHeaderProps {
  title: string;
  isCollapsed: boolean;
  onToggle?: () => void;
}

/**
 * Renders the collapsible header row for a sidebar section.
 *
 * @param props
 */
function SectionHeader({ title, isCollapsed, onToggle }: SectionHeaderProps) {
  return (
    <div
      className="d-flex align-items-center gap-1 px-2 border-bottom text-nowrap"
      style={{
        height: headerHeight,
        flexShrink: 0,
        cursor: onToggle ? "pointer" : "default",
        userSelect: "none",
      }}
      onClick={onToggle}
    >
      {onToggle && (
        <MaterialIcon
          style={{
            fontSize: "1.2em",
            transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 0.2s ease",
          }}
        >
          expand_more
        </MaterialIcon>
      )}

      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          flex: 1,
        }}
      >
        {title}
      </span>
    </div>
  );
}

interface SectionDragHandleProps {
  isActive: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
}

/**
 * Renders the drag handle between two sidebar sections.
 *
 * @param props
 */
function SectionDragHandle({
  isActive,
  onMouseDown,
  onDoubleClick,
  onMouseMove,
  onMouseUp,
}: SectionDragHandleProps) {
  return (
    <div
      style={{
        height: dragHandleHeight,
        flexShrink: 0,
        cursor: "row-resize",
        backgroundColor: isActive
          ? "rgba(73, 80, 87, 1)"
          : "rgba(73, 80, 87, 0.8)",
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    />
  );
}
