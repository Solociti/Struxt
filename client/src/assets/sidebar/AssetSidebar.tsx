import { sidebarSections } from "./sectionRegistry";
import { SidebarSection } from "./SidebarSection";
import { HeightDrag, useSidebarDrag } from "./useSidebarDrag";
import { defaultSidebarWidth, useSidebarState } from "./useSidebarState";

/**
 * Renders the resizable sidebar with collapsible, height-resizable sections
 * for Assets, Environments, and Routine Environments.
 */
export function AssetSidebar() {
  const { store, storeRef, patchStore, toggleCollapse, resetHeights } =
    useSidebarState();
  const {
    activeDragKind,
    dragRef,
    containerRef,
    handleWidthDragStart,
    handleHeightDragStart,
    handleMouseMove,
    handleMouseUp,
  } = useSidebarDrag(storeRef, patchStore);

  const { width, heights, collapsed } = store;
  const cursor = activeDragKind === "width" ? "col-resize" : "row-resize";

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
        {sidebarSections.map((section, i) => (
          <SidebarSection
            key={section.id}
            sectionDef={section}
            isLast={i === sidebarSections.length - 1}
            isCollapsed={collapsed[i]}
            height={section.isFlex ? undefined : heights[i - 1]}
            activeDragKind={activeDragKind}
            isHandleActive={
              activeDragKind === "height" &&
              (dragRef.current as HeightDrag | null)?.handleIdx === i
            }
            onToggleCollapse={() => toggleCollapse(i)}
            onDragHandleMouseDown={(e) => handleHeightDragStart(e, i)}
            onDragHandleDoubleClick={resetHeights}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        ))}

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
          onDoubleClick={() => patchStore({ width: defaultSidebarWidth })}
        />
      </div>
    </>
  );
}
