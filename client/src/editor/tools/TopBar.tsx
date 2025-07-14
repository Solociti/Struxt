import { DevicesProvider, WithEditor } from "@grapesjs/react";
import Form from "react-bootstrap/Form";
import { TopBarButtons } from "./TopBarButtons";
import IconButton from "client/components/IconButton";

export function TopBar() {
  return (
    <div className="gjs-top-sidebar d-flex align-items-center justify-content-between p-1">
      <div className="d-flex align-items-center gap-1">
        <IconButton
          icon="publish"
          variant="outline-secondary"
          size="sm"
        ></IconButton>
      </div>

      <DevicesProvider>
        {({ selected, select, devices }) => (
          <Form.Select
            value={selected}
            onChange={(ev) => select(ev.target.value)}
            style={{ width: "10em" }}
            size="sm"
          >
            {devices.map((device) => (
              <option value={device.id} key={device.id}>
                {device.getName()}
              </option>
            ))}
          </Form.Select>
        )}
      </DevicesProvider>

      <WithEditor>
        <TopBarButtons />
      </WithEditor>
    </div>
  );
}
