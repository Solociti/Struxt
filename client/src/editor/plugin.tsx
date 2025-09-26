import { LayoutConfig } from "@grapesjs/studio-sdk";
import AiChat from "client/aiPilot/AiChat";
import ErrorBoundary from "client/components/ErrorBoundary";
import MaterialIcon from "client/components/MaterialIcon";
import { addFonts } from "client/fonts/addFonts";
import { publishSite } from "client/publish/publishSite";
import { setupURL } from "common/format/url";
import { Editor } from "grapesjs";
import { createRoot } from "react-dom/client";
import { registerComponents } from "./components/htmlElements";
import launchIcon from "./components/icons/launch.svg?raw";
import { registerImageViewer } from "./components/imageViewer";
import { PermType, roles } from "common/models/user/Roles";
import { ThemeProvider } from "client/bootstrap/Theme";

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
export function customLayout(
  projectId: string,
  hasPermission: (permission: PermType) => boolean
): LayoutConfig {
  /**
   * Callback for when the left tab changes.
   * This is used to clean up the AI chat component when the tab is closed.
   */
  const onLeftTabChange: ((tab: string) => void)[] = [];
  let aiChatRoot: ReturnType<typeof createRoot> | null = null;
  let aiChatDiv: HTMLDivElement | null = null;

  return {
    default: {
      type: "row",
      style: { height: "100%" },
      children: [
        {
          type: "sidebarLeft",
          style: { maxHeight: "100vh", height: "100%", overflowY: "auto" },
          children: [
            {
              type: "tabs",
              value: "pages",
              onChange: ({ value, setState }) => {
                setState({ value });

                while (onLeftTabChange.length) {
                  const cb = onLeftTabChange.shift();
                  cb?.(value);
                }
              },
              tabs: [
                {
                  id: "pages",
                  // it seems that react components work just fine here. The type just doesn't match
                  label: (
                    <MaterialIcon title="Pages">article</MaterialIcon>
                  ) as any,
                  children: {
                    type: "panelPagesLayers",
                    style: {
                      maxHeight: "calc(100vh - 40px)",
                      overflowY: "auto",
                    },
                  },
                },

                {
                  id: "ai-pilot",
                  // it seems that react components work just fine here. The type just doesn't match
                  label: (
                    <MaterialIcon title="AI Chat">star_shine</MaterialIcon>
                  ) as any,
                  children: {
                    type: "custom",
                    style: { height: "100%" },
                    render: ({ editor }) => {
                      if (aiChatDiv) {
                        return aiChatDiv;
                      }

                      const div = document.createElement("div");
                      div.style.maxHeight = "calc(100vh - 40px)";
                      div.style.height = "100%";
                      aiChatDiv = div;

                      if (aiChatRoot) {
                        const prevRoot = aiChatRoot;
                        setTimeout(() => {
                          prevRoot?.unmount();
                        }, 0);
                      }

                      if (editor) {
                        // setup the ai chat react component
                        aiChatRoot = createRoot(div);

                        // TODO: check the project features to see if ai pilot is enabled
                        if (
                          hasPermission({
                            or: [roles.struxt.aiPilot, roles.struxt.admin],
                          })
                        ) {
                          aiChatRoot.render(
                            <ErrorBoundary>
                              <ThemeProvider>
                                <AiChat editor={editor} projectId={projectId} />
                              </ThemeProvider>
                            </ErrorBoundary>
                          );
                        } else {
                          aiChatRoot.render(
                            <div className="p-2">
                              <h5>Upgrade Required</h5>
                              <p>
                                Please upgrade your plan to use the AI Chat
                                feature
                              </p>
                            </div>
                          );
                        }
                      }

                      // onLeftTabChange.push(() => {
                      // aiChatRoot?.unmount();
                      // aiChatRoot = null;
                      // });

                      return div;
                    },
                  },
                },
              ],
            },
          ],
        },
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
