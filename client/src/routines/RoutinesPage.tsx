import { useLoadAsync } from "client/api/useLoadAsync";
import ErrorBoundary from "client/components/ErrorBoundary";
import MaterialIcon from "client/components/MaterialIcon";
import { ShowError } from "client/components/ShowError";
import { useCurrentProject } from "client/projects/ProjectContext";
import { RoutineListItem, RoutineModel } from "common/models/routines/Routine";
import { lazy, Suspense, useState } from "react";
import Nav from "react-bootstrap/Nav";
import Spinner from "react-bootstrap/Spinner";
import { FileIcon } from "./list/FileIcon";
import { getRoutine } from "./list/routineApis";
import { RoutineList } from "./list/RoutineList";

const CodeEditor = lazy(() => import("./codeEditor/CodeEditor"));

/**
 * Show the routines lists and editor
 *
 * @returns
 */
export default function RoutinesPage() {
  const { project } = useCurrentProject();

  /**
   * The list of routines that are open in the editor
   */
  const [openRoutines, setOpenRoutines] = useState<RoutineListItem[]>([]);

  const [selectedRoutine, setSelectedRoutine] =
    useState<RoutineListItem | null>(null);

  // load the current selected routine to display in the editor
  const [editRoutine, setEditRoutine] = useState<RoutineModel | null>(null);
  const { isLoading: loadingRoutine, error: routineError } =
    useLoadAsync(async () => {
      if (project.projectId === "*" || !selectedRoutine) {
        setEditRoutine(null);
        return null;
      }

      const r = await getRoutine(project.projectId, selectedRoutine.uuid);

      setEditRoutine(r);
      return null;
    }, [project.projectId, selectedRoutine]);

  // setup the ai chat context
  const {} = useLoadAsync(async () => {
    if (project.projectId === "*") {
      return null;
    }

    //TODO: Setup the ai chat context
    return null;
  }, [project.projectId]);

  // don't show anything if the project is not selected
  if (project.projectId === "*") {
    return (
      <div className="p-3">
        <h1 className="fw-bold">Routines</h1>
        <p className="text-muted">Please select a project to continue.</p>
      </div>
    );
  }

  /**
   * Handle when a file is opened in the editor.
   *
   * @param file
   * @returns
   */
  const handleOpenRoutine = (file: RoutineListItem) => {
    setSelectedRoutine(file);

    // add the file to the open routines list if it's not already there
    const index = openRoutines.findIndex((f) => f.uuid === file.uuid);
    if (index >= 0) {
      if (openRoutines[index] !== file) {
        setOpenRoutines((open) => [
          ...open.filter((f) => f.uuid !== file.uuid),
          file,
        ]);
      }

      return;
    }
    setOpenRoutines((open) => [...open, file]);
  };

  /**
   * Handle when a file is closed in the editor.
   *
   * @param file
   */
  const handleCloseRoutine = (file: RoutineListItem) => {
    setOpenRoutines((open) => {
      // get the current index as a starting point
      const currentIndex = open.findIndex((f) => f.uuid === file.uuid);

      // remove the file from the list
      const list = open.filter((f) => f.uuid !== file.uuid);
      const newIndex = Math.max(Math.min(currentIndex - 1, list.length - 1), 0);

      if (list[newIndex]) {
        setSelectedRoutine(list[newIndex]);
      } else {
        setSelectedRoutine(null);
      }

      return list;
    });
  };

  return (
    <div className="d-flex h-100" style={{ overflowY: "hidden" }}>
      <ErrorBoundary>
        {/* show a sidebar with the list of files */}
        <RoutineList
          projectId={project.projectId}
          handleEdit={handleOpenRoutine}
        />

        {/* Show the code editor */}
        <div
          className="d-flex flex-column h-100 flex-grow-1"
          style={{ overflow: "hidden", minWidth: 0 }}
        >
          <ErrorBoundary>
            <Nav
              variant="tabs"
              className="px-1 flex-shrink-0"
              activeKey={selectedRoutine?.uuid || ""}
              onSelect={(uuid) => {
                const file = openRoutines.find((f) => f.uuid === uuid);
                if (file) {
                  handleOpenRoutine(file);
                }
              }}
            >
              {openRoutines.map((routine) => {
                const isActive = selectedRoutine?.uuid === routine.uuid;
                const extension = routine.name.split(".").pop() || "";

                return (
                  <Nav.Item key={routine.uuid}>
                    <Nav.Link
                      eventKey={routine.uuid}
                      className="d-flex px-2 align-items-center cursor-pointer"
                      as="div"
                    >
                      <FileIcon extension={extension} />
                      {routine.name}
                      {isActive && (
                        <MaterialIcon
                          style={{ fontSize: "1.15em" }}
                          className="ms-1 cursor-pointer"
                          onClick={() => handleCloseRoutine(routine)}
                        >
                          close
                        </MaterialIcon>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                );
              })}
            </Nav>

            {/* show the editor for the selected routine */}
            {routineError && (
              <div className="p-5">
                <ShowError error={routineError} />
              </div>
            )}

            {!editRoutine && !loadingRoutine && (
              <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-muted">
                <MaterialIcon style={{ fontSize: "4rem" }}>code</MaterialIcon>
                <p className="mt-3">Select a routine to start editing</p>
              </div>
            )}

            {!editRoutine && loadingRoutine && (
              <div className="d-flex align-items-center justify-content-center flex-grow-1 text-muted">
                <Spinner variant="border" />
                <span className="ms-2">Loading routine...</span>
              </div>
            )}

            {editRoutine && (
              <Suspense
                fallback={
                  <div className="text-muted p-5 text-center">
                    <Spinner variant="border" />
                    <div>Loading Editor</div>
                  </div>
                }
              >
                <div
                  className="flex-grow-1"
                  style={{ minHeight: 0, position: "relative" }}
                >
                  <CodeEditor
                    routine={editRoutine}
                    openRoutines={openRoutines}
                  />
                </div>
              </Suspense>
            )}
          </ErrorBoundary>
        </div>

        {/* show the ai chat on the right side */}
      </ErrorBoundary>
    </div>
  );
}
