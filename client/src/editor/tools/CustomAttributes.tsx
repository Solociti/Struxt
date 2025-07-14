import { useEditor } from "@grapesjs/react";
import IconButton from "client/components/IconButton";
import { useEffect, useState } from "react";

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
    return Object.entries(attributes).map(([key, value]) => ({ key, value }));
  });

  console.log({ customAttributes, selected });

  useEffect(() => {
    const onUpdate = () => {
      setUpdateCounter((value) => value + 1);
    };

    editor.on("update", onUpdate);

    return () => {
      editor.off("update", onUpdate);
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
                "data-custom": "",
              });
            }
          }}
          variant="outline-secondary"
        ></IconButton>
      </div>

      <div>
        {customAttributes.length ? (
          customAttributes.map((attr, index) => (
            <div key={index} className="mb-2">
              {attr.map(({ key, value }) => (
                <div key={key}>
                  <strong>{key}:</strong> {value}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="text-muted">No custom properties available</div>
        )}
      </div>
    </div>
  );
}
