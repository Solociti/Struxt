import GjsEditor, {
  AssetsProvider,
  Canvas,
  ModalProvider,
  WithEditor,
} from "@grapesjs/react";
import SimpleModal from "client/components/modals/SimpleModal";
import { ErrorNames } from "common/custom-error/custom-error";
import grapesjs, { Editor, ProjectData } from "grapesjs";
import customCodePlugin from "grapesjs-custom-code";
import parserPostCSS from "grapesjs-parser-postcss";
import { useEffect, useState } from "react";
import { loadCurrentUser } from "../auth/user";
import { addFonts } from "../fonts/addFonts";
import { getProject } from "../projects/projects";
import { registerElements } from "./components/htmlElements";
import { registerImageViewer } from "./components/imageViewer";
import { CustomAssetManager } from "./tools/CustomAssetManager";
import { RightSideBar } from "./tools/RightSideBar";
import { TopBar } from "./tools/TopBar";

import "client/bootstrap/bootstrap.scss";

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
    <GrapesJsEditor
      projectId={projectId}
      setError={setError}
      setProjectId={setProjectId}
    />
  );
}

/**
 * Setup the grapesjs editor
 *
 * @param param0
 * @returns
 */
function GrapesJsEditor({
  projectId,
  setError,
  setProjectId,
}: {
  projectId: string;
  setError: (error: Error) => void;
  setProjectId: (projectId: string | null) => void;
}) {
  const onEditor = (editor: Editor) => {
    console.log("Editor loaded", { editor });
  };

  return (
    <GjsEditor
      grapesjs={grapesjs}
      grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
      onEditor={onEditor}
      options={{
        telemetry: false,
        height: "100vh",
        plugins: [
          parserPostCSS,
          customCodePlugin,
          (editor) => {
            registerElements(editor);
            registerImageViewer(editor);

            addFonts(editor);
          },
          (editor) => {
            // Add a custom save command
            editor.Commands.add("struxt:save", async (editor) => {
              const projectData = editor.getProjectData();
              await editor.Storage.store(projectData);
            });

            editor.onReady(() => {
              console.log("Editor is ready");
            });
          },
        ],
        storageManager: {
          autoload: true,
          recovery: true,
          autosave: true,
          stepsBeforeSave: 10,
          onStore: async (data: ProjectData, editor: Editor) => {
            console.log("Saving project data", { data, editor });
            // await saveProject(projectId, project);
            await new Promise((resolve) => setTimeout(resolve, 1000));

            return data;
          },
          onLoad: async () => {
            try {
              const response = await getProject(projectId);

              return response.editorData;
            } catch (err) {
              setError(err as Error);

              if ((err as Error).name === ErrorNames.ProjectNotFound) {
                setProjectId(null);
              }

              throw err;
            }
          },
        },
      }}
    >
      <div className="d-flex h-100 overflow-hidden">
        <div className="gjs-column-m d-flex flex-column flex-grow-1">
          <WithEditor>
            <TopBar />
          </WithEditor>
          <Canvas className="flex-grow gjs-custom-editor-canvas" />
        </div>

        <WithEditor>
          <RightSideBar />
        </WithEditor>
      </div>

      <ModalProvider>
        {({ open, title, content, close }) => (
          <SimpleModal show={open} onHide={close} title={title} size="lg">
            {content}
          </SimpleModal>
        )}
      </ModalProvider>

      <AssetsProvider>
        {({ assets, select, close, Container }) => (
          <Container>
            <CustomAssetManager assets={assets} select={select} close={close} />
          </Container>
        )}
      </AssetsProvider>
    </GjsEditor>
  );
}
