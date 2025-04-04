import { useLoadAsync } from "../api/useLoadAsync";
import { getProject } from "./projects";

export function useProject(projectId: string | null) {
  const {
    response: project,
    isLoading,
    error,
  } = useLoadAsync(async () => {
    if (!projectId) {
      return null;
    }

    // Load the project from the server
    const res = await getProject(projectId);
    return res.project;
  }, [projectId]);

  return {
    project,
    isLoading,
    error,
  };
}
