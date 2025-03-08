import StudioEditor from "@grapesjs/studio-sdk/react";
import { Editor } from "grapesjs";
import customCodePlugin from "grapesjs-custom-code";
import parserPostCSS from "grapesjs-parser-postcss";
import { useEffect, useState } from "react";
import { loadCurrentUser } from "../auth/user";
import { registerElements } from "../components/htmlElements";
import { registerImageViewer } from "../components/imageViewer";
import { addFonts } from "../fonts/addFonts";
import { deleteAssets, uploadAssets } from "../projects/assets";
import { getProject, saveProject } from "../projects/projects";
import { publishSite } from "../publish/publishSite";

// @ts-ignore
import "@grapesjs/studio-sdk/style";

export function EditorApp() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    // the project id is a parameter in the URL
    // e.g. http://localhost/editor?projectId=123

    const urlParams = new URLSearchParams(location.search);
    const projectId = urlParams.get("projectId");

    let _mounted = true;

    if (projectId) {
      // check if the user logged in
      loadCurrentUser()
        .then((user) => {
          console.log("User", user);

          if (user.isAuthenticated() && _mounted) {
            setProjectId(projectId);
            setLoggedIn(true);
          }
        })
        .catch((err) => {
          if (err.name === "Unauthorized") {
            setLoggedIn(false);
          }
        });
    } else {
      // don't load the editor if there is no project id
      setProjectId(null);
    }

    return () => {
      _mounted = false;
    };
  }, []);

  if (!loggedIn || !projectId) {
    return (
      <>
        <style>
          {`.error-content {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        .error-content section {
          text-align: center;
          padding: 3rem;
          margin: 1rem;
          border: 1px solid rgba(0, 0, 0, 0.4);
          border-radius: 6px;
          font-size: 1.2rem;
        }

        .error-content h3 {
          margin: 0;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          font-weight: 500;
        }

        .error-content a {
          background-color: #0d6efd;
          color: white;
          border: none;
          padding: 10px 20px;
          margin: 0.5rem;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          text-decoration: none;
          transition: background-color 0.3s;
        }
        .error-content a:hover {
          background-color: #0b5ed7;
        }
`}
        </style>

        <div className="error-content">
          {!loggedIn ? (
            <section>
              <h3>Please login to access the editor</h3>

              <a href={`/auth/login?test=${encodeURIComponent(location.href)}`}>
                Login
              </a>
            </section>
          ) : (
            <section>
              <h3>Please choose a project to continue.</h3>
            </section>
          )}
        </div>
      </>
    );
  }

  return (
    <StudioEditor
      options={{
        licenseKey:
          "39b0a964ef184394a659bb8015cc8822efcbe5c371a44a9f86883d45806f1065",
        project: {
          type: "web",
          id: projectId,
        },
        plugins: [
          parserPostCSS,
          customCodePlugin,
          (editor) => {
            editor.onReady(() => {
              // let's show the global style panel on start
              // editor.runCommand("studio:layoutToggle", {
              //   id: "gs",
              //   layout: "panelGlobalStyles",
              //   header: { label: "Global Styles" },
              //   placer: { type: "absolute", position: "right" },
              // });
            });
          },
          (editor) => {
            registerElements(editor);
            registerImageViewer(editor);

            addFonts(editor);
          },
        ],
        layout: {
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
                        icon: '<svg viewBox="0 0 24 24"><path d="m13.13 22.19-1.63-3.83a21.05 21.05 0 0 0 4.4-2.27l-2.77 6.1M5.64 12.5l-3.83-1.63 6.1-2.77a21.05 21.05 0 0 0-2.27 4.4M21.61 2.39S16.66.27 11 5.93a19.82 19.82 0 0 0-4.35 6.71c-.28.75-.09 1.57.46 2.13l2.13 2.12c.55.56 1.37.74 2.12.46A19.1 19.1 0 0 0 18.07 13c5.66-5.66 3.54-10.61 3.54-10.61m-7.07 7.07a2 2 0 0 1 2.83-2.83 2 2 0 0 1-2.83 2.83m-5.66 7.07-1.41-1.41 1.41 1.41M6.24 22l3.64-3.64a3.06 3.06 0 0 1-.97-.45L4.83 22h1.41M2 22h1.41l4.77-4.76-1.42-1.41L2 20.59V22m0-2.83 4.09-4.08c-.21-.3-.36-.62-.45-.97L2 17.76v1.41Z"/></svg>',
                        tooltip: "Publish website ",
                        onClick: ({
                          editor,
                          event,
                        }: {
                          editor: Editor;
                          event: any;
                        }) => {
                          const layoutId = "publishWebsiteProd";
                          const rect =
                            event.currentTarget.getBoundingClientRect();

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
              { type: "sidebarRight" },
            ],
          },
        },
        assets: {
          storageType: "self",
          // Provide a custom upload handler for assets
          onUpload: async ({ files }) => {
            return await uploadAssets(projectId, files);
          },
          // Provide a custom handler for deleting assets
          onDelete: async ({ assets }) => {
            return await deleteAssets(projectId, assets);
          },
        },
        storage: {
          type: "self",
          // Provide a custom handler for saving the project data.
          onSave: async ({ project }) => {
            await saveProject(projectId, project);
          },
          // Provide a custom handler for loading project data.
          onLoad: async () => {
            const response = await getProject(projectId);

            return { project: response.project };
          },
          autosaveChanges: 10,
          autosaveIntervalMs: 60000,
        },
      }}
    />
  );
}
