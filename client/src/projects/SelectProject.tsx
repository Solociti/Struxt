import { useState } from "react";
import { ProjectListItem } from "../../../common/models/projects/ProjectItem";
import { useLoadAsync } from "../api/useLoadAsync";
import Dropdown from "../components/Dropdown";
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
    <Dropdown.Button
      title={project.name}
      isLoading={isLoading}
      onToggle={setIsOpen}
    >
      {allowAll && (
        <Dropdown.Item onSelect={() => updateProject(AllProjectsData)}>
          {AllProjectsData.name}
        </Dropdown.Item>
      )}

      {projects &&
        projects.map((project) => (
          <Dropdown.Item
            key={project.id}
            onSelect={() => updateProject(project)}
          >
            {project.name}
          </Dropdown.Item>
        ))}

      {projects && projects.length === 0 && (
        <Dropdown.Item readOnly>No projects found</Dropdown.Item>
      )}
      {error && (
        <Dropdown.Item className="text-red-800" readOnly>
          {error.message}
        </Dropdown.Item>
      )}
    </Dropdown.Button>
  );
}
