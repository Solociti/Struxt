import { useEditor } from "@grapesjs/react";
import MaterialIcon from "client/components/MaterialIcon";
import type { Component } from "grapesjs";
import * as React from "react";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { cx } from "./common";

export declare interface LayerItemProps
  extends React.HTMLProps<HTMLDivElement> {
  component: Component;
  level: number;
  draggingCmp?: Component;
  dragParent?: Component;
}

const itemStyle = { maxWidth: `100%` };

export function LayerItem({
  component,
  draggingCmp,
  dragParent,
  ...props
}: LayerItemProps) {
  const editor = useEditor();
  const { Layers } = editor;
  const layerRef = useRef<HTMLDivElement>(null);
  const [layerData, setLayerData] = useState(Layers.getLayerData(component));
  const { open, selected, hovered, components, visible, name } = layerData;
  const componentsIds = components.map((cmp) => cmp.getId());
  const isDragging = draggingCmp === component;
  const cmpHash = componentsIds.join("-");
  const level = props.level + 1;
  const isHovered = hovered || dragParent === component;

  useEffect(() => {
    level === 0 && setLayerData(Layers.getLayerData(component));
    if (layerRef.current) {
      (layerRef.current as any).__cmp = component;
    }
  }, [component]);

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
    return components.map((cmp) => (
      <LayerItem
        key={cmp.getId()}
        component={cmp}
        level={level}
        draggingCmp={draggingCmp}
        dragParent={dragParent}
      />
    ));
  }, [cmpHash, draggingCmp, dragParent]);

  const toggleOpen = (ev: MouseEvent) => {
    ev.stopPropagation();
    Layers.setLayerData(component, { open: !open });
  };

  const toggleVisibility = (ev: MouseEvent) => {
    ev.stopPropagation();
    Layers.setLayerData(component, { visible: !visible });
  };

  const select = (event: MouseEvent) => {
    event.stopPropagation();
    Layers.setLayerData(component, { selected: true }, { event });
  };

  const hover = (hovered: boolean) => {
    if (!hovered || !draggingCmp) {
      Layers.setLayerData(component, { hovered });
    }
  };

  return (
    <div className="layer-item">
      <div
        onClick={select}
        onMouseEnter={() => hover(true)}
        onMouseLeave={() => hover(false)}
        className="cursor-default user-select-none"
        data-layer-item
        ref={layerRef}
      >
        <div
          className={[
            "d-flex align-items-center p-1 pr-2 border-bottom gap-1",
            level === 0 && "border-top",
            isHovered && "bg-secondary",
            selected && "bg-primary",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div
            style={{ marginLeft: `${level * 10}px` }}
            className={[
              "cursor-pointer",
              !components.length && "pointer-events-none opacity-0",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={toggleOpen}
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
              "group-hover:opacity-100 cursor-pointer",
              visible ? "opacity-0" : "opacity-100",
            ].join(" ")}
            onClick={toggleVisibility}
          >
            <MaterialIcon>
              {visible ? "visibility" : "visibility_off"}
            </MaterialIcon>
          </div>
        </div>
      </div>

      {!!(open && components.length) && (
        <div className={["w-100", !open && "d-none"].filter(Boolean).join(" ")}>
          {cmpToRender}
        </div>
      )}
    </div>
  );
}
