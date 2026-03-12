import React, { useCallback, useRef, useState } from "react";
import { calculateHeightResize, sidebarConstants } from "./heightDragMath";
import { defaultSidebarWidth, SidebarStoredState } from "./useSidebarState";

export type ActiveDragKind = "width" | "height";

interface WidthDrag {
  kind: "width";
  startX: number;
  startWidth: number;
}

export interface HeightDrag {
  kind: "height";
  startY: number;
  handleIdx: number;
  startHeights: number[];
}

type ActiveDrag = WidthDrag | HeightDrag;

/**
 * Manages all drag interactions for the sidebar (width and height resizing).
 *
 * @param storeRef live reference to current sidebar state
 * @param patchStore persists a partial state update
 */
export function useSidebarDrag(
  storeRef: { current: SidebarStoredState },
  patchStore: (patch: Partial<SidebarStoredState>) => void,
) {
  const [activeDragKind, setActiveDragKind] = useState<ActiveDragKind | null>(
    null,
  );
  const dragRef = useRef<ActiveDrag | null>(null);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWidthDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = {
        kind: "width",
        startX: e.clientX,
        startWidth: storeRef.current.width,
      };
    },
    [storeRef],
  );

  const handleHeightDragStart = useCallback(
    (e: React.MouseEvent, handleIdx: number) => {
      e.preventDefault();
      dragRef.current = {
        kind: "height",
        startY: e.clientY,
        handleIdx,
        startHeights: [...storeRef.current.heights],
      };
    },
    [storeRef],
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
          defaultSidebarWidth * 1.5,
        );
        patchStore({ width: Math.max(100, Math.min(newWidth, maxWidth)) });
        return;
      }

      if (dragRef.current.kind === "height") {
        const { startY, handleIdx, startHeights } = dragRef.current;
        const deltaY = e.clientY - startY;
        const containerHeight =
          containerRef.current?.clientHeight ?? window.innerHeight;
        const minFirstHeight = Math.max(150, window.innerHeight * 0.1);

        const newHeights = calculateHeightResize({
          heights: startHeights,
          collapsedStates: storeRef.current.collapsed,
          handleIdx,
          deltaY,
          containerHeight,
          minFirstHeight,
          minSectionHeight: sidebarConstants.minSectionHeight,
          dragHandleHeight: sidebarConstants.dragHandleHeight,
          sectionHeaderHeight: sidebarConstants.headerHeight,
        });

        patchStore({ heights: newHeights });
      }
    },
    [patchStore, storeRef],
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    isDraggingRef.current = false;
    setActiveDragKind(null);
  }, []);

  return {
    activeDragKind,
    dragRef,
    containerRef,
    handleWidthDragStart,
    handleHeightDragStart,
    handleMouseMove,
    handleMouseUp,
  };
}
