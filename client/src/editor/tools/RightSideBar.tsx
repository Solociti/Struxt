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
import { CustomAttributes } from "./CustomAttributes";
import { CustomBlockManager } from "./CustomBlockManager";
import { CustomLayerManager } from "./CustomLayerManager";
import { CustomPageManager } from "./CustomPageManager";
import { CustomSelectorManager } from "./CustomSelectorManager";
import { CustomStyleManager } from "./CustomStyleManager";
import { CustomTraitManager } from "./CustomTraitManager";

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
            <Nav.Link eventKey="styles" title="Styles">
              <MaterialIcon>brush</MaterialIcon>
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey="traits" title="Traits">
              <MaterialIcon>settings</MaterialIcon>
            </Nav.Link>
          </Nav.Item>

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
            <Nav.Link eventKey="pages" title="Pages">
              <MaterialIcon>tab_group</MaterialIcon>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content className="overflow-x-hidden overflow-y-auto">
          <Tab.Pane eventKey="layers">
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

          <Tab.Pane eventKey="pages">
            <PagesProvider>
              {(props) => <CustomPageManager {...props} />}
            </PagesProvider>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </div>
  );
}
