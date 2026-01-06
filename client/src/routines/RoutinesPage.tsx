import { useCurrentProject } from "client/projects/ProjectContext";
import { RoutineList } from "./list/RoutineList";
import { useLoadAsync } from "client/api/useLoadAsync";
import { useState } from "react";
import { RoutineListItem, RoutineModel } from "common/models/routines/Routine";
import { CodeEditor } from "./codeEditor/CodeEditor";
import { getRoutine } from "./list/routineApis";
import ErrorBoundary from "client/components/ErrorBoundary";

/**
 * Show the routines lists and editor
 *
 * @returns
 */
export default function RoutinesPage() {
  const { project } = useCurrentProject();

  const [selectedRoutine, setSelectedRoutine] =
    useState<RoutineListItem | null>(null);

  // load the current selected routine to display in the editor
  const [editRoutine, setEditRoutine] = useState<RoutineModel | null>(null);
  // const { isLoading: loadingRoutine, error: routineError } =
  useLoadAsync(async () => {
    if (project.projectId === "*" || !selectedRoutine) {
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

  return (
    <div className="d-flex h-100" style={{ overflowY: "hidden" }}>
      <ErrorBoundary>
        {/* show a sidebar with the list of files */}
        <RoutineList
          projectId={project.projectId}
          handleEdit={(file) => setSelectedRoutine(file)}
        />

        {/* Show the code editor */}
        <ErrorBoundary>
          {editRoutine && <CodeEditor routine={editRoutine} />}
        </ErrorBoundary>

        {/* show the ai chat on the right side */}
      </ErrorBoundary>
    </div>
  );
}
