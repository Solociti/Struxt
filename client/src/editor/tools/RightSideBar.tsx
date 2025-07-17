import {
  BlocksProvider,
  LayersProvider,
  PagesProvider,
  SelectorsProvider,
  StylesProvider,
  TraitsProvider,
  useEditor,
} from "@grapesjs/react";
import MaterialIcon from "client/components/MaterialIcon";
import { useEffect, useState } from "react";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import { CustomBlockManager } from "../blocks/CustomBlockManager";
import { CustomLayerManager } from "../layers/CustomLayerManager";
import { CustomPageManager } from "../page/CustomPageManager";
import { CustomTraitManager } from "../traits/CustomTraitManager";
import { CustomAttributes } from "./CustomAttributes";
import { CustomSelectorManager } from "./CustomSelectorManager";
import { CustomStyleManager } from "./CustomStyleManager";

export function RightSideBar() {
  const [hide, setHide] = useState(false);

  const editor = useEditor();

  useEffect(() => {
    const handleOn = () => {
      setHide(true);
    };
    const handleOff = () => {
      setHide(false);
    };

    editor.on("command:run:core:preview", handleOn);
    editor.on("command:stop:core:preview", handleOff);

    return () => {
      editor.off("command:run:core:preview", handleOn);
      editor.off("command:stop:core:preview", handleOff);
    };
  }, []);

  return (
    <div
      className={"gjs-right-sidebar d-flex flex-column"}
      style={
        hide
          ? { width: "0px", opacity: 0, transition: "all 0.5s" }
          : { width: "300px", opacity: 1, transition: "all 0.5s" }
      }
    >
      <Tab.Container defaultActiveKey="layers">
        <Nav variant="tabs" fill className="flex-nowrap">
          <Nav.Item>
            <Nav.Link eventKey="layers" title="Layers">
              <MaterialIcon>layers</MaterialIcon>
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey="blocks" title="Blocks">
              <MaterialIcon>add_box</MaterialIcon>
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey="styles" title="Styles">
              <MaterialIcon>brush</MaterialIcon>
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey="traits" title="Traits">
              <MaterialIcon>settings_applications</MaterialIcon>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content className="overflow-x-hidden overflow-y-auto">
          <Tab.Pane eventKey="layers">
            <h4 className="mb-2 p-2 d-flex align-items-center gap-2 text-muted border-bottom border-top">
              <MaterialIcon>tab_group</MaterialIcon>Pages
            </h4>
            <div
              className="overflow-y-auto overflow-x-hidden"
              style={{ height: "25vh" }}
            >
              <PagesProvider>
                {(props) => <CustomPageManager {...props} />}
              </PagesProvider>
            </div>

            <h4 className="mt-1 mb-2 p-2 d-flex align-items-center gap-2 text-muted border-bottom border-top">
              <MaterialIcon>layers</MaterialIcon>Layers
            </h4>
            <LayersProvider>
              {(props) => <CustomLayerManager {...props} />}
            </LayersProvider>
          </Tab.Pane>

          <Tab.Pane eventKey="styles">
            <SelectorsProvider>
              {(props) => <CustomSelectorManager {...props} />}
            </SelectorsProvider>
            <StylesProvider>
              {(props) => <CustomStyleManager {...props} />}
            </StylesProvider>
          </Tab.Pane>

          <Tab.Pane eventKey="traits">
            <TraitsProvider>
              {(props) => <CustomTraitManager {...props} />}
            </TraitsProvider>

            <CustomAttributes />
          </Tab.Pane>

          <Tab.Pane eventKey="blocks">
            <BlocksProvider>
              {(props) => <CustomBlockManager {...props} />}
            </BlocksProvider>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </div>
  );
}
