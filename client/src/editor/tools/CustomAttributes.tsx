import { useEditor } from "@grapesjs/react";
import { FormInput } from "client/components/FormInput";
import IconButton from "client/components/IconButton";
import { useEffect, useState } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

export function CustomAttributes() {
  const [_counter, setUpdateCounter] = useState(0);
  const editor = useEditor();

  const selected = editor.getSelectedAll();

  const customAttributes = selected.map((component) => {
    const attributes = component.getAttributes({
      noClass: true,
      noStyle: true,
      skipResolve: true,
    });

    const traits = component.getTraits();
    const traitNames = traits.map((trait) => trait.getName());

    return Object.entries(attributes)
      .map(([key, value]) => ({ key, value }))
      .filter((val) => !traitNames.includes(val.key));
  });

  useEffect(() => {
    const onUpdate = () => {
      setUpdateCounter((value) => value + 1);
    };

    editor.on("component:selected", onUpdate);
    editor.on("trait", onUpdate);

    return () => {
      editor.off("component:selected", onUpdate);
      editor.off("trait", onUpdate);
    };
  }, []);

  return (
    <div className="text-left mt-3 p-1">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h4>Custom Properties</h4>
        <IconButton
          icon="add"
          size="sm"
          onClick={() => {
            const components = editor.getSelectedAll();

            for (const component of components) {
              component.addAttributes({
                custom: "",
              });
            }

            setUpdateCounter((value) => value + 1);
          }}
          variant="outline-secondary"
        />
      </div>

      <div>
        {customAttributes.length ? (
          customAttributes.map((attr, index) => (
            <div key={index} className="mb-2">
              {/* This implementation isn't ideal. Need to deduplicate the attributes and figure out how to show different values in the selected components. */}
              {customAttributes.length > 1 && (
                <h5 className="text-capitalize mb-2">
                  {selected[index].get("type")} #{selected[index].getId()}
                </h5>
              )}

              <ListGroup>
                {attr.map(({ key, value }, index) => (
                  <AttributeItem
                    key={index}
                    prop={key}
                    value={value}
                    updateValue={(prop, value) => {
                      const components = editor.getSelectedAll();

                      for (const component of components) {
                        component.addAttributes({
                          [prop]: value,
                        });
                      }

                      setUpdateCounter((value) => value + 1);
                    }}
                    removeValue={() => {
                      const components = editor.getSelectedAll();

                      for (const component of components) {
                        component.removeAttributes(key);
                      }

                      setUpdateCounter((value) => value + 1);
                    }}
                  />
                ))}
              </ListGroup>
            </div>
          ))
        ) : (
          <div className="text-muted">No custom properties</div>
        )}
      </div>
    </div>
  );
}

interface AttributeItemProps {
  prop: string;
  value: string;

  updateValue: (prop: string, value: string) => void;
  removeValue: () => void;
}

function AttributeItem({
  prop,
  value,
  updateValue,
  removeValue,
}: AttributeItemProps) {
  const [edit, setEdit] = useState({ prop: prop || "", value: value || "" });

  const overlay = (
    <Popover>
      <Popover.Header as="h3">Edit</Popover.Header>
      <Popover.Body className="d-flex flex-column gap-3">
        <div className="mb-2 px-1">
          <div className="mb-1">Attribute</div>

          <FormInput
            type="text"
            className="form-control"
            value={edit.prop}
            onRealChange={(prop) => {
              setEdit({ ...edit, prop });
            }}
          />
        </div>

        <div className="mb-2 px-1">
          <div className="mb-1">Value</div>

          <FormInput
            type="text"
            className="form-control"
            value={edit.value}
            onRealChange={(value) => setEdit({ ...edit, value })}
          />
        </div>

        <div className="d-flex justify-content-end">
          <IconButton
            icon="check"
            variant="primary"
            size="sm"
            disabled={!edit.prop}
            onClick={() => {
              if (edit.prop !== prop) {
                removeValue();
              }

              updateValue(edit.prop, edit.value);
              setEdit({ prop, value });
            }}
          />
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      key={prop}
      trigger="click"
      placement="left"
      rootClose
      overlay={overlay}
      onEnter={() => {
        setEdit({ prop, value });
      }}
    >
      <ListGroup.Item className="d-flex justify-content-between align-items-center p-1 ps-2 cursor-pointer">
        <div>
          {prop}="{value}"
        </div>

        <IconButton
          size="sm"
          variant="transparent"
          icon="remove"
          onClick={removeValue}
        />
      </ListGroup.Item>
    </OverlayTrigger>
  );
}
