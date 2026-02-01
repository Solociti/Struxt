import { rteProseMirror } from "@grapesjs/studio-sdk-plugins";
import { Editor } from "@grapesjs/studio-sdk-plugins/dist/types.js";
import StudioEditor from "@grapesjs/studio-sdk/react";
import { saveExternalAsset } from "client/assets/saveAssets";
import { useCurrentUser } from "client/auth/userCurrentUser";
import { useTheme } from "client/bootstrap/Theme";
import { ErrorNames } from "common/custom-error/custom-error";
import customCodePlugin from "grapesjs-custom-code";
import parserPostCSS from "grapesjs-parser-postcss";
import { useEffect, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import { loadCurrentUser } from "../auth/user";
import { deleteAssets, uploadAssets } from "../projects/assets";
import { getProject, saveProject } from "../projects/projects";
import { useServiceWorker } from "../sw/useServiceWorker";
import { canvasTweaksPlugin } from "./components/canvasTweaks";
import { customLayout, setupStruxtPlugin } from "./plugin";

// @ts-ignore
import "@grapesjs/studio-sdk/style";
import "client/bootstrap/bootstrap.scss";
import { EditorAsset } from "common/models/assets/EditorAsset";

const licenseKey = location.hostname.includes("staging.struxt")
  ? "1ec0231ce53b49dfa4d36dd2520cd5f288a40e1e231e4acca3d6c0bb59ba5f39"
  : "39b0a964ef184394a659bb8015cc8822efcbe5c371a44a9f86883d45806f1065";

export function EditorApp() {
  const {
    isReady: swReady,
    error: swError,
    isRegistering: swRegistering,
  } = useServiceWorker();
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

  useEffect(() => {
    if (!swReady || !projectId) {
      return;
    }

    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      return;
    }

    controller.postMessage({
      type: "SET_PROJECT",
      projectId,
      context: "parent",
    });

    const controllerChangeListener = () => {
      const controller = navigator.serviceWorker.controller;
      if (!controller) {
        return;
      }
      controller.postMessage({
        type: "SET_PROJECT",
        projectId,
        context: "parent",
      });
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      controllerChangeListener,
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controllerChangeListener,
      );
    };
  }, [projectId, swReady]);

  if (swRegistering) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" variant="secondary" />
        <span className="ms-2 text-muted">Loading Editor...</span>
      </div>
    );
  }

  if (!loggedIn || !projectId || error || swError) {
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
          {swError && (
            <section>
              <h3>
                {swError.message.includes("not supported")
                  ? "Browser Not Supported"
                  : "Editor Initialization Failed"}
              </h3>

              <p>{swError.message}</p>

              <button onClick={() => window.location.reload()}>
                Refresh Page
              </button>
            </section>
          )}

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
                        `${location.pathname}?projectId=${projectId}`,
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
                      `${location.pathname}?projectId=${projectId}`,
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
  const { theme } = useTheme();

  const { hasPermission } = useCurrentUser();

  return (
    <div id="editor-app" style={{ height: "100vh" }}>
      <StudioEditor
        options={{
          licenseKey,
          project: {
            type: "web",
            id: projectId,
          },
          theme: theme,
          plugins: [
            parserPostCSS,
            customCodePlugin,
            rteProseMirror?.init({
              toolbar({ items }) {
                return items.filter((item) => item.id !== "image");
              },
            }),
            setupStruxtPlugin,
            canvasTweaksPlugin(projectId),
            // handle adding external assets
            (editor: Editor) => {
              editor.on("asset:add", (item) => {
                let src = item.getSrc();
                if (src.startsWith("http://")) {
                  src = src.replace("http://", "https://");
                }
                if (src.startsWith("https://")) {
                  saveExternalAsset(projectId, src).then((asset) => {
                    editor.Assets.remove(item);
                    editor.Assets.add({
                      ...asset,
                    });
                  });
                }
              });
            },
          ],
          layout: customLayout(projectId, hasPermission),
          assets: {
            storageType: "self",
            // Provide a custom upload handler for assets
            onUpload: async ({ files }) => {
              const { assets } = await uploadAssets(projectId, files);
              return assets;
            },
            // Provide a custom handler for deleting assets
            onDelete: async ({ assets }) => {
              await deleteAssets(
                projectId,
                assets.map((a) => ({
                  uuid: (a.attributes as EditorAsset).uuid,
                  isPermanent: false,
                })),
              );
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
        }}
      />
    </div>
  );
}
