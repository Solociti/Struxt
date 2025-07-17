import createStudioEditor from "@grapesjs/studio-sdk";
import { Editor } from "grapesjs";
import customCodePlugin from "grapesjs-custom-code";
import parserPostCSS from "grapesjs-parser-postcss";
import { useEffect, useState } from "react";
import { ErrorNames } from "common/custom-error/custom-error";
import { loadCurrentUser } from "../auth/user";
import { registerElements } from "./components/htmlElements";
import { registerImageViewer } from "./components/imageViewer";
import { addFonts } from "../fonts/addFonts";
import { deleteAssets, uploadAssets } from "../projects/assets";
import { getProject, saveProject } from "../projects/projects";
import { publishSite } from "../publish/publishSite";

// @ts-ignore
import "@grapesjs/studio-sdk/style";

const licenseKey = location.hostname.includes("staging.struxt")
  ? "1ec0231ce53b49dfa4d36dd2520cd5f288a40e1e231e4acca3d6c0bb59ba5f39"
  : "39b0a964ef184394a659bb8015cc8822efcbe5c371a44a9f86883d45806f1065";

export function EditorApp() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [projectIdInput, setProjectIdInput] = useState("");

  useEffect(() => {
    // the project id is a parameter in the URL
    // e.g. http://localhost/editor?projectId=123

    const urlParams = new URLSearchParams(location.search);
    const projectId = urlParams.get("projectId") || urlParams.get("project_id");

    let _mounted = true;
    // check if the user logged in
    loadCurrentUser()
      .then((user) => {
        if (user.isAuthenticated() && _mounted) {
          setLoggedIn(true);
        }
      })
      .catch((err) => {
        if (err.name === "Unauthorized") {
          setLoggedIn(false);
        } else {
          setError(err);
        }
      });

    if (projectId) {
      setProjectId(projectId);
    } else {
      // don't load the editor if there is no project id
      setProjectId(null);
    }

    return () => {
      _mounted = false;
    };
  }, []);

  if (!loggedIn || !projectId || error) {
    return (
      <>
        <style>
          {`.error-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
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
          background-color: rgb(41, 41, 41);
        }

        .error-content h3 {
          margin: 0;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          font-weight: 500;
        }

        .error-content a, .error-content button {
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
        .error-content a:hover, .error-content button:hover {
          background-color: #0b5ed7;
        } 

        .error-content input {
          padding: 10px;
          margin: 0.5rem;
          border-radius: 4px;
          font-size: 16px;
        }
`}
        </style>

        <div className="error-content">
          {error && (
            <section>
              <h3>{error.name}</h3>

              <p>{error.message}</p>
            </section>
          )}

          {!loggedIn && (
            <section>
              <h3>Please login to access the editor</h3>

              <a href={`/auth/login`}>Login</a>
            </section>
          )}

          {!projectId && (
            <section>
              <h3>Please choose a project to continue.</h3>

              <input
                type="text"
                value={projectIdInput}
                onChange={(event) => {
                  setProjectIdInput(event.target.value);
                }}
                onKeyUp={(event) => {
                  if (event.key === "Enter") {
                    const projectId = projectIdInput.trim();

                    if (projectId) {
                      location.assign(
                        `${location.pathname}?projectId=${projectId}`
                      );
                    }
                  }
                }}
                placeholder="Project ID"
              />
              <button
                onClick={() => {
                  const projectId = projectIdInput.trim();

                  if (projectId) {
                    location.assign(
                      `${location.pathname}?projectId=${projectId}`
                    );
                  }
                }}
              >
                Open Project
              </button>
            </section>
          )}
        </div>
      </>
    );
  }

  return (
    <CustomEditor
      projectId={projectId}
      setError={setError}
      setProjectId={setProjectId}
    />
  );
}

/**
 * Create and setup the editor
 *
 * @param param0
 * @returns
 */
function CustomEditor({
  projectId,
  setError,
  setProjectId,
}: {
  projectId: string;
  setError: (error: Error) => void;
  setProjectId: (projectId: string | null) => void;
}) {
  useEffect(() => {
    createStudioEditor({
      root: "#editor-app",
      licenseKey,
      project: {
        type: "web",
        id: projectId,
      },
      plugins: [
        parserPostCSS,
        customCodePlugin,
        (editor) => {
          editor.onReady(() => {
            (window as any).editor = editor;
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
          try {
            const response = await getProject(projectId);

            return { project: response.editorData };
          } catch (err) {
            setError(err as Error);

            if ((err as Error).name === ErrorNames.ProjectNotFound) {
              setProjectId(null);
            }

            throw err;
          }
        },
        autosaveChanges: 10,
        autosaveIntervalMs: 60000,
      },
    });
  }, []);

  return <div id="editor-app" style={{ height: "100%" }}></div>;
}
