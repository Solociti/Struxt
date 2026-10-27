import { ProjectListItem } from "common/models/projects/ProjectItem";
import { createContext, useContext, useState } from "react";

export const AllProjectsData: ProjectListItem = {
  projectId: "*",
  description: "",
  name: "All Projects",
};
Object.freeze(AllProjectsData);

/**
 * Keeps track of the currently selected projects
 */
const ProjectContext = createContext<{
  project: ProjectListItem;
  setProject: React.Dispatch<React.SetStateAction<ProjectListItem>>;
  isSingleProject: boolean;
}>({
  project: {
    ...AllProjectsData,
  },
  setProject: () => {},
  isSingleProject: false,
});

/**
 * Setup the base context for the selected project ID
 *
 * @param param0
 * @returns
 */
export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<ProjectListItem>(AllProjectsData);

  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject,
        isSingleProject: project.projectId !== "*" && project.projectId !== "",
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

/**
 * Get the current project state
 *
 * @returns
 */
export function useCurrentProject() {
  return useContext(ProjectContext);
}
