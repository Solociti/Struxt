import { SelectorsResultProps } from "@grapesjs/react";
import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";

export function CustomSelectorManager({
  selectors,
  selectedState,
  states,
  targets,
  setState,
  addSelector,
  removeSelector,
}: Omit<SelectorsResultProps, "Container">) {
  const addNewSelector = () => {
    const next = selectors.length + 1;
    addSelector({ name: `new-${next}`, label: `New ${next}` });
  };

  const targetStr = targets.join(", ");

  return (
    <div className="gjs-custom-selector-manager p-2 d-flex flex-column gap-2 text-left">
      <div className="d-flex align-items-center gap-2">
        <div className="flex-grow-1">Selectors</div>
        <Form.Select
          value={selectedState}
          onChange={(ev) => setState(ev.target.value)}
        >
          <option value="">- State -</option>

          {states.map((state) => (
            <option value={state.id} key={state.id}>
              {state.getName()}
            </option>
          ))}
        </Form.Select>
      </div>
      <div className="d-flex align-items-center gap-2 flex-wrap p-2 border rounded">
        {targetStr ? (
          <IconButton
            icon="add"
            onClick={addNewSelector}
            variant="outline-secondary"
            className={"rounded px-2 py-1"}
          ></IconButton>
        ) : (
          <div className="text-muted">Select a component</div>
        )}

        {selectors.map((selector) => (
          <Badge
            key={selector.toString()}
            bg={selector.getActive() ? "primary" : "secondary"}
            className="d-flex align-items-center gap-1"
          >
            <span>{selector.getLabel()}</span>

            <MaterialIcon
              className="cursor-pointer"
              onClick={() => removeSelector(selector)}
            >
              remove
            </MaterialIcon>
          </Badge>
        ))}
      </div>
      <div>
        Selected: <span className="text-muted">{targetStr || "None"}</span>
      </div>
    </div>
  );
}
