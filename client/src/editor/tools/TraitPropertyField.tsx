import { useEditor } from "@grapesjs/react";
import type { Trait } from "grapesjs";
import * as React from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

interface StylePropertyFieldProps extends React.HTMLProps<HTMLDivElement> {
  trait: Trait;
}

export function TraitPropertyField({
  trait,
  ...rest
}: StylePropertyFieldProps) {
  const editor = useEditor();
  const handleChange = (value: string) => {
    trait.setValue(value);
  };

  const onChange = (ev: any) => {
    handleChange(ev.target.value);
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
    <Form.Control
      placeholder={defValue}
      value={value}
      onChange={onChange}
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
                  onChange={(ev) => handleChange(ev.target.value)}
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
            type="checkbox"
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
  }

  return (
    <div {...rest} className="mb-3 px-1">
      <div className="mb-2 text-capitalize">{trait.getLabel()}</div>

      {inputToRender}
    </div>
  );
}
