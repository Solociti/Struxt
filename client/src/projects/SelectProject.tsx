import { ProjectListItem } from "common/models/projects/ProjectItem";
import { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useLoadAsync } from "../api/useLoadAsync";
import { AllProjectsData } from "./ProjectContext";
import { getAvailableProjects } from "./projects";

export interface SelectProjectProps {
  allowAll?: boolean;

  /**
   * The current selected project id
   */
  project: ProjectListItem;

  /**
   * Handle selecting the project id
   *
   * @param project
   * @returns
   */
  updateProject: (project: ProjectListItem) => void;
}

export default function SelectProject({
  allowAll = false,
  project,
  updateProject,
}: SelectProjectProps) {
  // setup the dropdown states
  const [isOpen, setIsOpen] = useState(false);

  const {
    response: projects,
    isLoading,
    error,
  } = useLoadAsync<ProjectListItem[]>(async () => {
    if (!isOpen) {
      return null;
    }

    // Load the projects from the server
    const res = await getAvailableProjects();
    return res.list;
  }, [isOpen]);

  return (
    <Dropdown onToggle={setIsOpen}>
      <Dropdown.Toggle
        variant="outline-secondary"
        style={{
          minWidth: "16rem",
        }}
      >
        {project.name}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {projects && projects.length === 0 && (
          <Dropdown.Item disabled>No projects found</Dropdown.Item>
        )}

        {error && (
          <Dropdown.Item className="text-danger" disabled>
            {error.message}
          </Dropdown.Item>
        )}

        {isLoading && (
          <Dropdown.Item disabled>
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </Dropdown.Item>
        )}

        {allowAll && (
          <Dropdown.Item onClick={() => updateProject(AllProjectsData)}>
            {AllProjectsData.name}
          </Dropdown.Item>
        )}

        <Dropdown.Divider />

        {projects &&
          projects.map((project) => (
            <Dropdown.Item
              key={project.id}
              onClick={() => updateProject(project)}
            >
              {project.name}
            </Dropdown.Item>
          ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
