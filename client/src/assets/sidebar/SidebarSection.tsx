import MaterialIcon from "client/components/MaterialIcon";
import React from "react";
import { sidebarConstants } from "./heightDragMath";
import { SidebarSectionDef } from "./sectionRegistry";
import { ActiveDragKind } from "./useSidebarDrag";

const { headerHeight, dragHandleHeight } = sidebarConstants;

interface SidebarSectionProps {
  sectionDef: SidebarSectionDef;
  isLast: boolean;
  isCollapsed: boolean;
  height?: number;
  activeDragKind: ActiveDragKind | null;
  isHandleActive: boolean;
  onToggleCollapse: () => void;
  onDragHandleMouseDown: (e: React.MouseEvent) => void;
  onDragHandleDoubleClick: () => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
}

/**
 * Renders a single sidebar section with its header, content, and optional drag handle.
 *
 * @param0
 */
export function SidebarSection({
  sectionDef,
  isLast,
  isCollapsed,
  height,
  activeDragKind,
  isHandleActive,
  onToggleCollapse,
  onDragHandleMouseDown,
  onDragHandleDoubleClick,
  onMouseMove,
  onMouseUp,
}: SidebarSectionProps) {
  const Content = sectionDef.contentComponent;

  return (
    <div style={{ display: "contents" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          ...(sectionDef.isFlex
            ? { flex: 1, minHeight: headerHeight }
            : {
                height: isCollapsed ? headerHeight : height,
                flexShrink: 0,
                transition: activeDragKind ? undefined : "height 0.3s ease",
              }),
        }}
      >
        <SectionHeader
          title={sectionDef.title}
          isCollapsed={isCollapsed}
          onToggle={sectionDef.canCollapse ? onToggleCollapse : undefined}
        />

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            display: isCollapsed ? "none" : undefined,
          }}
        >
          <Content />
        </div>
      </div>

      {!isLast && (
        <SectionDragHandle
          isActive={isHandleActive}
          onMouseDown={onDragHandleMouseDown}
          onDoubleClick={onDragHandleDoubleClick}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        />
      )}
    </div>
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
 * @param0
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
 * @param0
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
