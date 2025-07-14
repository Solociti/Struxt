import { DevicesProvider, useEditor } from "@grapesjs/react";
import IconButton from "client/components/IconButton";
import { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import { TopBarButtons } from "./TopBarButtons";

export function TopBar() {
  const [hide, setHide] = useState(false);
  const [_counter, setCounter] = useState(0);

  const editor = useEditor();

  useEffect(() => {
    const handleOn = () => {
      setHide(true);
    };
    const handleOff = () => {
      setHide(false);
    };

    const updateCounter = () => {
      setCounter((value) => value + 1);
    };

    editor.on("command:run:core:preview", handleOn);
    editor.on("command:stop:core:preview", handleOff);

    editor.on("command:run:core:preview", updateCounter);
    editor.on("command:stop:core:preview", updateCounter);

    return () => {
      editor.off("command:run:core:preview", handleOn);
      editor.off("command:stop:core:preview", handleOff);

      editor.off("command:run:core:preview", updateCounter);
      editor.off("command:stop:core:preview", updateCounter);
    };
  }, []);

  return (
    <div
      className={
        "gjs-top-sidebar d-flex align-items-center justify-content-between px-1 " +
        (hide ? "py-0" : "py-1")
      }
      style={
        hide
          ? {
              height: "0px",
              opacity: 0,
              transition: "all 0.5s",
            }
          : { height: "", opacity: 1, transition: "all 0.5s" }
      }
    >
      <div className="d-flex align-items-center gap-1">
        <IconButton
          icon="visibility"
          variant="outline-secondary"
          size="sm"
          onClick={() => {
            if (editor.Commands.isActive("core:preview")) {
              editor.Commands.stop("core:preview");
            } else {
              editor.Commands.run("core:preview");
            }
          }}
        />

        <IconButton
          icon="publish"
          variant="outline-secondary"
          size="sm"
          // TODO: implement publish
          onClick={() => {
            console.log("Publish action triggered");
          }}
        />
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

      <TopBarButtons />
    </div>
  );
}
