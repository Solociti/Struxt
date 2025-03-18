import { useState } from "react";
import { ProjectListItem } from "../../../common/models/projects/ProjectItem";
import { useLoadAsync } from "../api/useLoadAsync";
import Dropdown from "../components/Dropdown";
import { getAvailableProjects } from "./projects";

export interface SelectProjectProps {
  allowAll?: boolean;
}

export default function SelectProject({
  allowAll = false,
}: SelectProjectProps) {
  const [selectedProject, setSelectedProject] =
    useState<ProjectListItem | null>(null);

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
      title={selectedProject?.name || "All Projects"}
      isLoading={isLoading}
      onToggle={setIsOpen}
    >
      {allowAll && (
        <Dropdown.Item onSelect={() => setSelectedProject(null)}>
          All Projects
        </Dropdown.Item>
      )}

      {projects &&
        projects.map((project) => (
          <Dropdown.Item
            key={project.id}
            onSelect={() => setSelectedProject(project)}
          >
            {project.name}
          </Dropdown.Item>
        ))}

      {projects && projects.length === 2 && (
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
