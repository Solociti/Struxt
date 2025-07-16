import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useEditor } from "@grapesjs/react";
import MaterialIcon from "client/components/MaterialIcon";
import type { Component } from "grapesjs";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import Collapse from "react-bootstrap/Collapse";

interface LayerSectionProps {
  component: Component;
  level: number;
  activeDragId?: string | null;
}

interface LayerItemProps {
  component: Component;
  level: number;
}

interface DropIndicatorProps {
  componentId: string;
  index: number;
  level: number;
  isVisible: boolean;
}

const itemStyle = { maxWidth: `100%` };

/**
 * Drop indicator component that shows where an item will be dropped
 */
function DropIndicator({
  componentId,
  index,
  level,
  isVisible,
}: DropIndicatorProps) {
  const editor = useEditor();
  const { Components } = editor;

  const { setNodeRef, isOver, active } = useDroppable({
    id: `drop-${componentId}-${index}`,
    data: {
      type: "drop-indicator",
      parentId: componentId,
      index,
    },
  });

  // Add debugging
  useEffect(() => {
    if (isVisible) {
      console.log("DropIndicator created:", {
        id: `drop-${componentId}-${index}`,
        parentId: componentId,
        index,
        level,
        isOver,
      });
    }
  }, [isVisible, componentId, index, level, isOver]);

  // Check if this is a valid drop target
  const isValidDropTarget = (() => {
    if (!active || !isVisible) return false;

    const dragComponent = Components.getById(active.id as string);
    const parentComponent = Components.getById(componentId);

    if (!dragComponent || !parentComponent) return false;

    // Don't allow dropping on self or descendants
    if (
      dragComponent === parentComponent ||
      dragComponent.parents().includes(parentComponent)
    ) {
      return false;
    }

    const canMove = Components.canMove(parentComponent, dragComponent, index);
    return canMove.result;
  })();

  if (!isVisible || !isValidDropTarget) return null;

  return (
    <div
      ref={setNodeRef}
      className={`drop-indicator ${isOver ? "drop-indicator-active" : ""}`}
      style={{
        height: isOver ? "12px" : "8px",
        marginLeft: `${level * 10 + 20}px`,
        marginRight: "10px",
        backgroundColor: isOver
          ? "rgba(0, 123, 255, 0.15)"
          : isVisible
          ? "rgba(0, 123, 255, 0.05)"
          : "transparent",
        transition: "all 0.2s ease",
        position: "relative",
        display: "flex",
        alignItems: "center",
        borderRadius: "2px",
        minHeight: "8px", // Ensure minimum hit area
        cursor: isOver ? "copy" : "default",
        border: isVisible ? "1px dashed rgba(0, 123, 255, 0.3)" : "none",
      }}
    >
      {isOver && (
        <>
          {/* Main drop line */}
          <div
            style={{
              width: "100%",
              height: "3px",
              backgroundColor: "#007bff",
              borderRadius: "1.5px",
              boxShadow: "0 0 6px rgba(0, 123, 255, 0.5)",
            }}
          />
          {/* Drop arrows */}
          <div
            style={{
              position: "absolute",
              left: "-8px",
              width: "0",
              height: "0",
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderBottom: "8px solid #007bff",
              transform: "translateY(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "-8px",
              width: "0",
              height: "0",
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderBottom: "8px solid #007bff",
              transform: "translateY(-50%)",
            }}
          />
        </>
      )}
    </div>
  );
}

export function LayerSection({
  component,
  activeDragId,
  ...props
}: LayerSectionProps) {
  const editor = useEditor();
  const { Layers, Components } = editor;

  const [layerData, setLayerData] = useState(Layers.getLayerData(component));
  const { open, components } = layerData;

  // Only make this droppable if it has no children or children are collapsed
  // This prevents interference with drop indicators
  const shouldBeDroppable = components.length === 0 || !open;

  const { setNodeRef, isOver, active } = useDroppable({
    id: component.getId(),
    data: {
      id: component.getId(),
    },
    disabled: !shouldBeDroppable,
  });

  const isValidOver = (() => {
    if (!isOver || !active) {
      return false;
    }

    const dragComponent = Components.getById(active.id as string);
    if (!dragComponent) {
      return false;
    }

    // Don't allow dropping on self or descendants
    if (
      dragComponent === component ||
      dragComponent.parents().includes(component)
    ) {
      return false;
    }

    const valid = Components.canMove(component, dragComponent, 0);
    return valid.result;
  })();

  const componentsIds = components.map((cmp) => cmp.getId());
  const cmpHash = componentsIds.join("-");
  const level = props.level + 1;

  useEffect(() => {
    const up = (cmp: Component) => {
      cmp === component && setLayerData(Layers.getLayerData(cmp));
    };
    const ev = Layers.events.component;
    editor.on(ev, up);

    return () => {
      editor.off(ev, up);
    };
  }, [editor, Layers, component]);

  const cmpToRender = useMemo(() => {
    const renderItems = [];

    // Add drop indicator before first item
    if (components.length > 0) {
      renderItems.push(
        <DropIndicator
          key={`drop-${component.getId()}-0`}
          componentId={component.getId()}
          index={0}
          level={level}
          isVisible={!!activeDragId}
        />
      );
    }

    // Render each component with drop indicator after it
    components.forEach((cmp, index) => {
      renderItems.push(
        <LayerSection
          key={cmp.getId()}
          component={cmp}
          level={level}
          activeDragId={activeDragId}
        />
      );

      // Add drop indicator after each item (except the last one, unless it's expanded)
      if (
        index < components.length - 1 ||
        (index === components.length - 1 && open)
      ) {
        renderItems.push(
          <DropIndicator
            key={`drop-${component.getId()}-${index + 1}`}
            componentId={component.getId()}
            index={index + 1}
            level={level}
            isVisible={!!activeDragId}
          />
        );
      }
    });

    return renderItems;
  }, [cmpHash, level, component, components, activeDragId, open]);

  return (
    <div
      className={`layer-item ${
        isValidOver ? "bg-info bg-opacity-25 border border-info" : ""
      }`}
      ref={setNodeRef}
      style={{
        borderRadius: isValidOver ? "4px" : "0",
        transition: "all 0.2s ease",
      }}
    >
      <LayerItem component={component} level={level} />

      <Collapse
        in={Boolean(open && components.length)}
        mountOnEnter
        unmountOnExit
      >
        <div className="w-100">{cmpToRender}</div>
      </Collapse>
    </div>
  );
}

export function LayerItem({ component, ...props }: LayerItemProps) {
  const editor = useEditor();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: component.getId(),
      data: {
        id: component.getId(),
        component,
      },
    });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const { Layers } = editor;
  const [layerData, setLayerData] = useState(Layers.getLayerData(component));
  const { open, selected, hovered, components, visible, name, locked } =
    layerData;

  const level = props.level + 1;
  const isHovered = hovered;

  useEffect(() => {
    const up = (cmp: Component) => {
      cmp === component && setLayerData(Layers.getLayerData(cmp));
    };
    const ev = Layers.events.component;
    editor.on(ev, up);

    return () => {
      editor.off(ev, up);
    };
  }, [editor, Layers, component]);

  const toggleOpen = (ev: MouseEvent) => {
    ev.stopPropagation();
    Layers.setLayerData(component, { open: !open });
  };

  const toggleLock = (ev: MouseEvent) => {
    ev.stopPropagation();
    Layers.setLocked(component, !locked);
  };

  const toggleVisibility = (ev: MouseEvent) => {
    ev.stopPropagation();
    Layers.setVisible(component, !visible);
  };

  const select = (event: MouseEvent) => {
    event.stopPropagation();
    Layers.setLayerData(component, { selected: true }, { event });
  };

  const hover = (hovered: boolean) => {
    Layers.setLayerData(component, { hovered });
  };

  return (
    <div
      onMouseEnter={() => hover(true)}
      onMouseLeave={() => hover(false)}
      onClick={select}
      className={`cursor-pointer user-select-none ${
        isDragging ? "dragging-layer-item" : ""
      }`}
      ref={setNodeRef}
      style={{
        ...style,
        transform: isDragging
          ? `${style?.transform || ""} scale(1.02)`
          : style?.transform,
        zIndex: isDragging ? 1000 : "auto",
        transition: isDragging ? "none" : "transform 0.2s ease",
      }}
    >
      <div
        className={[
          "d-flex align-items-center p-1 pe-2 border-bottom gap-1",
          level === 0 && "border-top",
          isHovered && "bg-secondary",
          selected && "bg-primary",
          isDragging && "opacity-50 bg-info",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className="cursor-grab d-flex align-items-center"
          {...listeners}
          {...attributes}
        >
          <MaterialIcon
            style={{
              fontSize: "1rem",
              color: "#6c757d",
              opacity: isDragging ? 0.5 : 0.7,
            }}
          >
            drag_handle
          </MaterialIcon>
        </div>

        <div
          className={[
            "cursor-pointer",
            !components.length && "pe-none opacity-0",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ marginLeft: `${level * 10}px` }}
          onClick={toggleOpen}
          onMouseDown={(ev) => {
            ev.stopPropagation();
            ev.preventDefault();
          }}
        >
          <MaterialIcon
            style={{
              transform: `rotate(${open ? 0 : -90}deg)`,
              transition: "transform 0.2s ease-in-out",
            }}
          >
            arrow_drop_down
          </MaterialIcon>
        </div>

        <div className="text-truncate flex-grow-1" style={itemStyle}>
          {name}
        </div>

        <div
          className={[
            "cursor-pointer",
            locked ? "opacity-100" : "opacity-25",
          ].join(" ")}
          onClick={toggleLock}
        >
          <MaterialIcon style={{ fontSize: "1.2rem" }}>
            {locked ? "lock" : "lock_open_right"}
          </MaterialIcon>
        </div>

        <div
          className={[
            "cursor-pointer",
            visible ? "opacity-25" : "opacity-100",
          ].join(" ")}
          onClick={toggleVisibility}
        >
          <MaterialIcon style={{ fontSize: "1.2rem" }}>
            {visible ? "visibility" : "visibility_off"}
          </MaterialIcon>
        </div>
      </div>
    </div>
  );
}
