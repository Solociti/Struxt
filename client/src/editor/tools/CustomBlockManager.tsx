import { BlocksResultProps } from "@grapesjs/react";

export type CustomBlockManagerProps = Pick<
  BlocksResultProps,
  "mapCategoryBlocks" | "dragStart" | "dragStop"
>;

// TODO: update the grid

export function CustomBlockManager({
  mapCategoryBlocks,
  dragStart,
  dragStop,
}: CustomBlockManagerProps) {
  return (
    <div className="gjs-custom-block-manager text-left">
      {Array.from(mapCategoryBlocks).map(([category, blocks]) => (
        <div key={category}>
          <div className="py-2 px-4 border">{category}</div>
          <div className="grid grid-cols-2 gap-2 p-2">
            {blocks.map((block) => (
              <div
                key={block.getId()}
                draggable
                className="d-flex flex-col align-items-center border rounded cursor-pointer py-2 px-5"
                onDragStart={(ev) => dragStart(block, ev.nativeEvent)}
                onDragEnd={() => dragStop(false)}
              >
                <div
                  className="h-10 w-10"
                  dangerouslySetInnerHTML={{ __html: block.getMedia()! }}
                />
                <div
                  className="text-sm text-center w-100"
                  title={block.getLabel()}
                >
                  {block.getLabel()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
