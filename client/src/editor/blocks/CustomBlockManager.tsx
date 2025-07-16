import { BlocksResultProps } from "@grapesjs/react";
import Accordion from "react-bootstrap/Accordion";

export type CustomBlockManagerProps = Pick<
  BlocksResultProps,
  "mapCategoryBlocks" | "dragStart" | "dragStop"
>;

export function CustomBlockManager({
  mapCategoryBlocks,
  dragStart,
  dragStop,
}: CustomBlockManagerProps) {
  const list = Array.from(mapCategoryBlocks)
    .map(([category, blocks]) => {
      return {
        category,
        blocks,
      };
    })
    .sort((a, b) => {
      return a.category.localeCompare(b.category);
    });

  return (
    <div className="gjs-custom-block-manager text-start">
      <Accordion defaultActiveKey={["Basic", "Extra"]} alwaysOpen>
        {list.map(({ category, blocks }) => (
          <Accordion.Item key={category} eventKey={category}>
            <Accordion.Header>{category}</Accordion.Header>

            <Accordion.Body className="row g-2">
              {blocks.map((block) => (
                <div key={block.getId()} className="col-6">
                  <div
                    draggable
                    className="d-flex flex-column align-items-center border rounded py-2 px-3"
                    style={{ cursor: "pointer" }}
                    onDragStart={(ev) => dragStart(block, ev.nativeEvent)}
                    onDragEnd={() => dragStop(false)}
                  >
                    <div
                      style={{ height: "2.5rem", width: "2.5rem" }}
                      dangerouslySetInnerHTML={{ __html: block.getMedia()! }}
                    />
                    <div className="small text-center" title={block.getLabel()}>
                      {block.getLabel()}
                    </div>
                  </div>
                </div>
              ))}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
}
