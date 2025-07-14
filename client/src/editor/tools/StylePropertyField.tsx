import * as React from "react";
import { useEditor } from "@grapesjs/react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import MaterialIcon from "client/components/MaterialIcon";
import IconButton from "client/components/IconButton";
import type {
  Property,
  PropertyComposite,
  PropertyRadio,
  PropertySelect,
  PropertySlider,
  PropertyStack,
} from "grapesjs";
import { ROUND_BORDER_COLOR, cx } from "./common";

interface StylePropertyFieldProps extends React.HTMLProps<HTMLDivElement> {
  prop: Property;
}

export function StylePropertyField({ prop, ...rest }: StylePropertyFieldProps) {
  const editor = useEditor();
  const handleChange = (value: string) => {
    prop.upValue(value);
  };

  const onChange = (ev: any) => {
    handleChange(ev.target.value);
  };

  const openAssets = () => {
    const { Assets } = editor;
    Assets.open({
      select: (asset, complete) => {
        console.log({ complete });
        prop.upValue(asset.getSrc(), { partial: !complete });
        complete && Assets.close();
      },
      types: ["image"],
      accept: "image/*",
    });
  };

  const type = prop.getType();
  const defValue = prop.getDefaultValue();
  const canClear = prop.canClear();
  const hasValue = prop.hasValue();
  const value = prop.getValue();
  const valueString = hasValue ? value : "";
  const valueWithDef = hasValue ? value : defValue;

  let inputToRender = (
    <Form.Control
      placeholder={defValue}
      value={valueString}
      onChange={onChange}
      size="sm"
    />
  );

  switch (type) {
    case "radio":
      {
        const radioProp = prop as PropertyRadio;
        inputToRender = (
          <div className="d-flex">
            {radioProp.getOptions().map((option) => (
              <Form.Check
                key={radioProp.getOptionId(option)}
                type="radio"
                id={`radio-${radioProp.getOptionId(option)}`}
                name={radioProp.getId()}
                value={radioProp.getOptionId(option)}
                label={radioProp.getOptionLabel(option)}
                checked={value === radioProp.getOptionId(option)}
                onChange={onChange}
                className="me-3"
              />
            ))}
          </div>
        );
      }
      break;
    case "select":
      {
        const selectProp = prop as PropertySelect;
        inputToRender = (
          <Form.Select value={value} onChange={onChange} size="sm">
            {selectProp.getOptions().map((option) => (
              <option
                key={selectProp.getOptionId(option)}
                value={selectProp.getOptionId(option)}
              >
                {selectProp.getOptionLabel(option)}
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
              <div
                className={`w-[15px] h-[15px] ${ROUND_BORDER_COLOR}`}
                style={{ backgroundColor: valueWithDef }}
              >
                <input
                  type="color"
                  className="w-[15px] h-[15px] cursor-pointer opacity-0"
                  value={valueWithDef}
                  onChange={(ev) => handleChange(ev.target.value)}
                />
              </div>
            </InputGroup.Text>
            <Form.Control
              placeholder={defValue}
              value={valueString}
              onChange={onChange}
            />
          </InputGroup>
        );
      }
      break;
    case "slider":
      {
        const sliderProp = prop as PropertySlider;
        inputToRender = (
          <Form.Range
            value={parseFloat(value) || sliderProp.getMin()}
            min={sliderProp.getMin()}
            max={sliderProp.getMax()}
            step={sliderProp.getStep()}
            onChange={(ev) => handleChange(ev.target.value)}
          />
        );
      }
      break;
    case "file":
      {
        inputToRender = (
          <div className="flex flex-col items-center gap-3">
            {value && value !== defValue && (
              <div
                className="w-[50px] h-[50px] rounded inline-block bg-cover bg-center cursor-pointer"
                style={{ backgroundImage: `url("${value}")` }}
                onClick={() => handleChange("")}
              />
            )}
            <Button variant="outline-secondary" onClick={openAssets}>
              Select Image
            </Button>
          </div>
        );
      }
      break;
    case "composite":
      {
        const compositeProp = prop as PropertyComposite;
        inputToRender = (
          <div
            className={cx("flex flex-wrap p-2 bg-black/20", ROUND_BORDER_COLOR)}
          >
            {compositeProp.getProperties().map((prop) => (
              <StylePropertyField key={prop.getId()} prop={prop} />
            ))}
          </div>
        );
      }
      break;
    case "stack":
      {
        const stackProp = prop as PropertyStack;
        const layers = stackProp.getLayers();
        const isTextShadow = stackProp.getName() === "text-shadow";
        inputToRender = (
          <div
            className={cx(
              "flex flex-col p-2 gap-2 bg-black/20 min-h-[54px]",
              ROUND_BORDER_COLOR
            )}
          >
            {layers.map((layer) => (
              <div key={layer.getId()} className={ROUND_BORDER_COLOR}>
                <div className="flex gap-1 bg-slate-800 px-2 py-1 items-center">
                  <IconButton
                    icon="keyboard_arrow_up"
                    size="sm"
                    onClick={() => layer.move(layer.getIndex() - 1)}
                  />
                  <IconButton
                    icon="keyboard_arrow_down"
                    size="sm"
                    onClick={() => layer.move(layer.getIndex() + 1)}
                  />
                  <button className="flex-grow" onClick={() => layer.select()}>
                    {layer.getLabel()}
                  </button>
                  <div
                    className={cx(
                      "bg-white min-w-[17px] min-h-[17px] text-black text-sm flex justify-center",
                      ROUND_BORDER_COLOR
                    )}
                    style={layer.getStylePreview({
                      number: { min: -3, max: 3 },
                      camelCase: true,
                    })}
                  >
                    {isTextShadow && "T"}
                  </div>
                  <IconButton
                    icon="delete"
                    size="sm"
                    onClick={() => layer.remove()}
                  />
                </div>
                {layer.isSelected() && (
                  <div className="p-2 flex flex-wrap">
                    {stackProp.getProperties().map((prop) => (
                      <StylePropertyField key={prop.getId()} prop={prop} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      break;
  }

  return (
    <div
      {...rest}
      className={cx("mb-3 px-1", prop.isFull() ? "w-full" : "w-1/2")}
    >
      <div className={cx("flex mb-2 items-center", canClear && "text-sky-300")}>
        <div className="flex-grow capitalize">{prop.getLabel()}</div>
        {canClear && (
          <button onClick={() => prop.clear()}>
            <MaterialIcon>close</MaterialIcon>
          </button>
        )}
        {type === "stack" && (
          <IconButton
            icon="add"
            size="sm"
            className="!ml-2"
            onClick={() => (prop as PropertyStack).addLayer({}, { at: 0 })}
          />
        )}
      </div>
      {inputToRender}
    </div>
  );
}
