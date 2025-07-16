import {
  DndContext,
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { LayersResultProps, useEditor } from "@grapesjs/react";
import { useState } from "react";
import { LayerSection } from "./LayerItem";

const wrapGridStyle = {
  touchAction: "none",
};

/**
 * Custom collision detection that prioritizes drop indicators over layer sections
 */
const customCollisionDetection: CollisionDetection = (args) => {
  // First, get all collisions
  const pointerCollisions = pointerWithin(args);
  const rectCollisions = rectIntersection(args);

  // Combine both collision types
  const allCollisions = [...pointerCollisions, ...rectCollisions];

  // Prioritize drop indicators (they have 'drop-' prefix in their id)
  const dropIndicatorCollisions = allCollisions.filter(
    (collision) =>
      typeof collision.id === "string" && collision.id.startsWith("drop-")
  );

  if (dropIndicatorCollisions.length > 0) {
    return dropIndicatorCollisions;
  }

  // Fall back to regular collision detection
  return closestCenter(args);
};

/**
 * Custom layer manager component that handles drag and drop functionality
 * for the layers panel with support for dropping between items
 */
export function CustomLayerManager({
  root,
}: Omit<LayersResultProps, "Container">) {
  const editor = useEditor();
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const { Components } = editor;

  return (
    <div
      className="gjs-custom-layer-manager h-100 overflow-y-auto overflow-x-hidden text-sm text-left select-none d-relative"
      style={wrapGridStyle}
    >
      <DndContext
        modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
        collisionDetection={customCollisionDetection}
        onDragEnd={(ev) => {
          const { active, over } = ev;

          console.log("Drag end:", {
            active: active?.id,
            over: over?.id,
            overData: over?.data?.current,
          });

          if (!over || !active) {
            setActiveDrag(null);
            return;
          }

          const dragComponent = Components.getById(active.id as string);
          if (!dragComponent) {
            setActiveDrag(null);
            return;
          }

          const overData = over.data.current;

          if (overData?.type === "drop-indicator") {
            console.log("Dropping between items:", {
              parentId: overData.parentId,
              index: overData.index,
            });

            // Handle drop between items at specific index
            const parentComponent = Components.getById(overData.parentId);
            if (parentComponent && parentComponent !== dragComponent) {
              // Prevent dropping on self or descendants
              if (!dragComponent.parents().includes(parentComponent)) {
                const canMove = Components.canMove(
                  parentComponent,
                  dragComponent,
                  overData.index
                );
                console.log("Can move result:", canMove);
                if (canMove.result) {
                  dragComponent.move(parentComponent, { at: overData.index });
                  console.log("Moved component successfully");
                } else {
                  console.log("Cannot move component:", canMove.reason);
                }
              } else {
                console.log("Cannot drop on self or descendants");
              }
            }
          } else {
            console.log("Dropping inside component");

            // Handle drop inside component (existing behavior)
            const targetComponent = Components.getById(over.id as string);
            if (targetComponent && targetComponent !== dragComponent) {
              // Prevent dropping on self or descendants
              if (!dragComponent.parents().includes(targetComponent)) {
                const canMove = Components.canMove(
                  targetComponent,
                  dragComponent,
                  0
                );
                if (canMove.result) {
                  dragComponent.move(targetComponent, { at: 0 });
                }
              }
            }
          }

          setActiveDrag(null);
        }}
        onDragStart={(ev) => {
          setActiveDrag(ev.active.id as string);
        }}
      >
        {!!root && (
          <LayerSection component={root} level={-1} activeDragId={activeDrag} />
        )}
      </DndContext>
    </div>
  );
}
