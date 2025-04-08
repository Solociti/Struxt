import { ProjectDetails } from "common/models/projects/ProjectDetails";
import Spinner from "react-bootstrap/Spinner";
import { useLoadAsync } from "../api/useLoadAsync";
import { useCurrentProject } from "../projects/ProjectContext";
import { getAvailableProjects, getProjectDetails } from "../projects/projects";
import { ShowProject } from "./ShowProject";

export default function DashboardContent() {
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

    /**
     * List of project details to load
     */
    const details: ProjectDetails[] = [];

    for (const projectId of projectIds) {
      const data = await getProjectDetails(projectId);
      details.push(data);
    }
    return details;
  }, [project.id]);

  if (isLoading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center my-5">
        <Spinner animation="border" variant="secondary" />

        <span className="ms-2 text-muted">Loading Content...</span>
      </div>
    );
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
