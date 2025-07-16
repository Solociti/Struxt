import { useEditor } from "@grapesjs/react";
import { FormInput } from "client/components/FormInput";
import type { Trait } from "grapesjs";
import * as React from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { PropertyGroup } from "../tools/PropertyGroup";
import { UrlField } from "./UrlField";

interface StylePropertyFieldProps {
  trait: Trait;
}

/**
 * Render the trait property field
 *
 * @param param0
 * @returns
 */
export function TraitPropertyField({ trait }: StylePropertyFieldProps) {
  const editor = useEditor();

  const onChange = (ev: any) => {
    trait.setValue(ev.target.value);
  };

  const handleButtonClick = () => {
    const command = trait.get("command");
    if (command) {
      typeof command === "string"
        ? editor.runCommand(command)
        : command(editor, trait);
    }
  };

  const type = trait.getType();
  const defValue = trait.getDefault() || trait.attributes.placeholder;
  const value = trait.getValue();
  const valueWithDef = typeof value !== "undefined" ? value : defValue;

  let inputToRender = (
    <FormInput
      placeholder={defValue}
      value={value}
      onRealChange={(value) => trait.setValue(value)}
      size="sm"
    />
  );

  switch (type) {
    case "select":
      {
        inputToRender = (
          <Form.Select value={value} onChange={onChange} size="sm">
            {trait.getOptions().map((option) => (
              <option
                key={trait.getOptionId(option)}
                value={trait.getOptionId(option)}
              >
                {trait.getOptionLabel(option)}
              </option>
            ))}
          </Form.Select>
        );
      }
      break;

    case "color":
      {
        inputToRender = (
          <InputGroup size="sm">
            <InputGroup.Text>
              <div style={{ backgroundColor: valueWithDef }}>
                <input
                  type="color"
                  className="cursor-pointer opacity-0"
                  value={valueWithDef}
                  onChange={(ev) => trait.setValue(ev.target.value)}
                />
              </div>
            </InputGroup.Text>

            <Form.Control
              placeholder={defValue}
              value={value}
              onChange={onChange}
            />
          </InputGroup>
        );
      }
      break;

    case "checkbox":
      {
        inputToRender = (
          <Form.Check
            type="switch"
            checked={value}
            onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
              trait.setValue(ev.target.checked)
            }
          />
        );
      }
      break;

    case "button":
      {
        inputToRender = (
          <Button className="w-100" onClick={handleButtonClick}>
            {trait.getLabel()}
          </Button>
        );
      }
      break;

    case "number":
      {
        inputToRender = (
          <FormInput
            type="number"
            placeholder={defValue}
            value={value}
            onRealChange={(value) => trait.setValue(value)}
            size="sm"
            min={trait.get("min")}
            max={trait.get("max")}
            step={trait.get("step")}
          />
        );
      }
      break;

    case "asset-src":
      {
        inputToRender = (
          <>
            <InputGroup size="sm">
              <FormInput
                placeholder={defValue}
                value={value}
                onRealChange={(value) => trait.setValue(value)}
              />

              <Button
                variant="outline-secondary"
                onClick={() => {
                  const assetManager = editor.AssetManager;

                  assetManager.open({
                    select(asset, complete) {
                      const selected = editor.getSelected();
                      if (selected) {
                        selected.addAttributes({
                          src: asset.getSrc(),
                        });

                        complete && assetManager.close();
                      }
                    },
                  });
                }}
              >
                Select
              </Button>
            </InputGroup>
          </>
        );
      }
      break;

    case "href":
      {
        return (
          <UrlField
            editor={editor}
            trait={trait}
            value={value}
            defValue={defValue}
          />
        );
      }
      break;
  }

  return (
    <PropertyGroup label={trait.getLabel()}>{inputToRender}</PropertyGroup>
  );
}
