import { LayoutConfig } from "@grapesjs/studio-sdk";
import { addFonts } from "client/fonts/addFonts";
import { publishSite } from "client/publish/publishSite";
import { Editor } from "grapesjs";
import { registerComponents } from "./components/htmlElements";
import launchIcon from "./components/icons/launch.svg?raw";
import { registerImageViewer } from "./components/imageViewer";
import MaterialIcon from "client/components/MaterialIcon";

/**
 * Setup the struxt customizations for the editor.
 *
 * @param editor
 */
export function setupStruxtPlugin(editor: Editor) {
  editor.onReady(() => {
    // setup a global editor variable for debugging
    // @ts-ignore
    window.editor = editor;

    console.log("Editor Ready.");
  });

  // Register custom components
  registerComponents(editor);
  registerImageViewer(editor);

  // register custom fonts
  addFonts(editor);

  console.log("Struxt plugin initialized");
}

/**
 * Customize the layout of the editor.
 *
 * @param projectId
 * @returns
 */
export function customLayout(projectId: string): LayoutConfig {
  return {
    default: {
      type: "row",
      style: { height: "100%" },
      children: [
        { type: "sidebarLeft" },
        {
          type: "canvasSidebarTop",
          sidebarTop: {
            leftContainer: {
              buttons: ({ items }: { items: any[] }) => [
                ...items,
                {
                  id: "",
                  type: "button",
                  icon: launchIcon,
                  tooltip: "Publish website ",
                  onClick: ({
                    editor,
                    event,
                  }: {
                    editor: Editor;
                    event: any;
                  }) => {
                    const layoutId = "publishWebsiteProd";
                    const rect = event.currentTarget.getBoundingClientRect();

                    editor.runCommand("studio:layoutToggle", {
                      id: layoutId,
                      header: false,
                      placer: {
                        type: "popover",
                        closeOnClickAway: true,
                        x: rect.x,
                        y: rect.y,
                        w: rect.width,
                        h: rect.height,
                        options: { placement: "bottom-start" },
                      },
                      style: { width: 200 },
                      layout: {
                        type: "column",
                        style: { padding: 10, gap: 10 },
                        children: [
                          {
                            type: "button",
                            variant: "primary",
                            label: "Publish Staging",
                            full: true,
                            onClick: async (event: any) => {
                              await publishSite(
                                event.editor,
                                projectId,
                                "staging"
                              );

                              editor.runCommand("studio:layoutRemove", {
                                id: layoutId,
                              });
                            },
                          },
                          {
                            type: "button",
                            variant: "primary",
                            label: "Publish Production",
                            full: true,
                            onClick: async (event: any) => {
                              await publishSite(
                                event.editor,
                                projectId,
                                "production"
                              );

                              editor.runCommand("studio:layoutRemove", {
                                id: layoutId,
                              });
                            },
                          },
                        ],
                      },
                    });
                  },
                },
              ],
            },
          },
        },
        {
          type: "sidebarRight",
          children: [
            {
              type: "tabs",
              value: "add",
              tabs: [
                {
                  id: "add",
                  label: (
                    <MaterialIcon title="New Components">add</MaterialIcon>
                  ) as any as string,
                  children: {
                    type: "panelBlocks",
                    style: {
                      maxHeight: "calc(100vh - 40px)",
                      overflowY: "auto",
                    },
                  },
                },
                {
                  id: "styles",
                  label: (
                    <MaterialIcon title="Styles">format_shapes</MaterialIcon>
                  ) as any as string,
                  children: {
                    type: "column",
                    style: { height: "100%" },
                    children: [
                      {
                        type: "panelSelectors",
                        stateSelector: true,
                        styleCatalog: false,
                        style: { padding: 5 },
                      },
                      { type: "panelStyles" },
                    ],
                  },
                },
                {
                  id: "props",
                  label: (
                    <MaterialIcon title="Properties">
                      settings_applications
                    </MaterialIcon>
                  ) as any as string,
                  children: {
                    type: "panelProperties",
                    style: { padding: 5, height: "100%" },
                  },
                },
                {
                  id: "global-styles",
                  label: (
                    <MaterialIcon title="Global Styles">css</MaterialIcon>
                  ) as any as string,
                  children: {
                    type: "panelGlobalStyles",
                    style: {
                      padding: "0.5rem",
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  };
}
