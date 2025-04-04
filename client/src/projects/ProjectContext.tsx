import { createContext, useContext, useState } from "react";
import { ProjectListItem } from "../../../common/models/projects/ProjectItem";

export const AllProjectsData: ProjectListItem = {
  id: "*",
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
}>({
  project: {
    ...AllProjectsData,
  },
  setProject: () => {},
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
    <ProjectContext.Provider value={{ project, setProject }}>
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
