import { ProjectDetails } from "../../../common/models/projects/ProjectDetails";
import { getApi } from "../api/api";
import { useLoadAsync } from "../api/useLoadAsync";
import { useCurrentProject } from "../projects/ProjectContext";
import { getAvailableProjects } from "../projects/projects";
import { ShowProject } from "./ShowProject";

export function DashboardContent() {
  const { project } = useCurrentProject();

  const {
    response: projectList,
    isLoading,
    error,
  } = useLoadAsync(async () => {
    if (!project) {
      return null;
    }
    /**
     * List of project ids to load
     */
    let projectIds: string[] = [];
    if (project.id === "*") {
      // get the list of available projects
      const { list } = await getAvailableProjects();
      projectIds = list.map((p) => p.id);
    } else {
      projectIds = [project.id];
    }

    const details: ProjectDetails[] = [];

    for (const projectId of projectIds) {
      const data = await getApi(["/api/projects/details", projectId], {});
      details.push(data.details as ProjectDetails);
    }
    return details;
  }, [project.id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!projectList || projectList.length === 0) {
    return <div>No project found</div>;
  }

  return projectList.map((project) => (
    <ShowProject key={project.id} project={project} />
  ));
}
