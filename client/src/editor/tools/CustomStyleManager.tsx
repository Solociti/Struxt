import { StylesResultProps } from "@grapesjs/react";
import Accordion from "react-bootstrap/Accordion";
import { StylePropertyField } from "./StylePropertyField";

export function CustomStyleManager({
  sectors,
}: Omit<StylesResultProps, "Container">) {
  return (
    <div className="gjs-custom-style-manager text-left">
      <Accordion defaultActiveKey="0">
        {sectors.map((sector, index) => (
          <Accordion.Item key={sector.getId()} eventKey={index.toString()}>
            <Accordion.Header>{sector.getName()}</Accordion.Header>

            <Accordion.Body>
              {sector.getProperties().map((prop) => (
                <StylePropertyField key={prop.getId()} prop={prop} />
              ))}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
}
