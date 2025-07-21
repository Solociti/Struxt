import { LayoutConfig } from "@grapesjs/studio-sdk";
import { addFonts } from "client/fonts/addFonts";
import { publishSite } from "client/publish/publishSite";
import { Editor } from "grapesjs";
import { registerComponents } from "./components/htmlElements";
import launchIcon from "./components/icons/launch.svg?raw";
import { registerImageViewer } from "./components/imageViewer";
import MaterialIcon from "client/components/MaterialIcon";
import { setupURL } from "common/format/url";

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

  addCustomStyles(editor);

  // Register custom components
  registerComponents(editor);
  registerImageViewer(editor);

  // register custom fonts
  addFonts(editor);

  console.log("Struxt plugin initialized");
}

function addCustomStyles(editor: Editor) {
  // add the bullet styles for lists (ol, ul)
  editor.onReady(() => {
    // editor.StyleManager.addProperty("gs-typography", {
    //   label: "List Style",
    //   property: "list-style",
    //   type: "select",
    //   default: "",
    //   options: [
    //     { id: "", label: "Default" },
    //     { id: "none", label: "None" },
    //     { id: "disc", label: "Disc" },
    //     { id: "circle", label: "Circle" },
    //     { id: "square", label: "Square" },
    //   ],
    // });

    // Create a custom sector for lists
    const sector = editor.StyleManager.addSector("custom-lists", {
      name: "List Styles",
      visible: false,
    });
    sector.on("change:visible", (sector) => {
      // get the current selected component
      const selected = editor.getSelected();

      if (selected && ["ul", "ol", "li"].includes(selected.getType())) {
        sector.set("visible", true);
      } else {
        sector.set("visible", false);
      }
    });

    editor.StyleManager.addProperty("custom-lists", {
      label: "Type",
      property: "list-style-type",
      type: "select",
      default: "",
      full: true,
      options: [
        { id: "", label: "Default" },
        { id: "none", label: "None" },
        { id: "disc", label: "Disc" },
        { id: "circle", label: "Circle" },
        { id: "square", label: "Square" },
        { id: "decimal", label: "Number" },
        { id: "lower-roman", label: "Lower Roman" },
        { id: "upper-roman", label: "Upper Roman" },
        { id: "lower-alpha", label: "Lower Alpha" },
        { id: "upper-alpha", label: "Upper Alpha" },
      ],
    });

    editor.StyleManager.addProperty("custom-lists", {
      label: "Position",
      property: "list-style-position",
      type: "select",
      default: "",
      full: true,
      options: [
        { id: "", label: "Default" },
        { id: "inside", label: "Inside" },
        { id: "outside", label: "Outside" },
      ],
    });
  });
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
                  onClick: setupPublishOpenClick(projectId),
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
                  // it seems that react components work just fine here. The type just doesn't match
                  label: (
                    <MaterialIcon title="New Components">add</MaterialIcon>
                  ) as any,
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
                  // it seems that react components work just fine here. The type just doesn't match
                  label: (
                    <MaterialIcon title="Styles">format_shapes</MaterialIcon>
                  ) as any,
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
                  // it seems that react components work just fine here. The type just doesn't match
                  label: (
                    <MaterialIcon title="Properties">
                      settings_applications
                    </MaterialIcon>
                  ) as any,
                  children: {
                    type: "panelProperties",
                    style: { padding: 5, height: "100%" },
                  },
                },
                {
                  id: "global-styles",
                  // it seems that react components work just fine here. The type just doesn't match
                  label: (
                    <MaterialIcon title="Global Styles">css</MaterialIcon>
                  ) as any,
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

function setupPublishOpenClick(projectId: string) {
  return ({ editor, event }: { editor: Editor; event: any }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const placer = {
      x: rect.x,
      y: rect.y,
      w: rect.width,
      h: rect.height,
    };

    editor.runCommand("studio:layoutToggle", {
      id: "publishWebsiteProd",
      header: false,
      placer: {
        type: "popover",
        closeOnClickAway: true,
        ...placer,
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
            onClick: publishCallback(editor, placer, {
              projectId,
              env: "staging",
            }),
          },
          {
            type: "button",
            variant: "primary",
            label: "Publish Production",
            full: true,
            onClick: publishCallback(editor, placer, {
              projectId,
              env: "production",
            }),
          },
        ],
      },
    });
  };
}

function publishCallback(
  editor: Editor,
  placer: { x: number; y: number; w: number; h: number },
  {
    projectId,
    env,
  }: {
    projectId: string;
    env: "staging" | "production";
  }
) {
  return async () => {
    // close the publish layout
    editor.runCommand("studio:layoutRemove", {
      id: "publishWebsiteProd",
    });

    // show a progress layout
    editor.runCommand("studio:layoutToggle", {
      id: "publishWebsiteProgress",
      header: false,
      placer: {
        type: "popover",
        ...placer,
        options: { placement: "bottom-start" },
      },
      layout: {
        type: "column",
        style: { padding: 10, gap: 10 },
        children: [
          {
            type: "text",
            content: `Publishing ${env}...`,
          },
        ],
      },
    });

    const result = await publishSite(editor, projectId, env);

    // remove the progress layout
    editor.runCommand("studio:layoutRemove", {
      id: "publishWebsiteProgress",
    });

    if (result) {
      editor.runCommand("studio:layoutToggle", {
        id: "publishWebsiteComplete",
        header: false,
        placer: {
          type: "popover",
          closeOnClickAway: true,
          ...placer,
          options: { placement: "bottom-start" },
        },
        style: { width: 200 },
        layout: {
          type: "column",
          style: { padding: 10, gap: 10 },
          children: [
            {
              type: "text",
              content: `Published ${env} successfully!`,
            },
            {
              type: "button",
              variant: "primary",
              label: result.primaryDomain,
              full: true,
              onClick: () => {
                const url = setupURL(result.primaryDomain);
                window.open(url.toString(), `published-${projectId}-${env}`);

                editor.runCommand("studio:layoutRemove", {
                  id: "publishWebsiteComplete",
                });
              },
            },
          ],
        },
      });
    }
  };
}
