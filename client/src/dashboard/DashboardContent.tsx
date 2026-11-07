import { FormInput } from "client/components/FormInput";
import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { ShowError } from "client/components/ShowError";
import { ProjectListFilter } from "common/api/projects/project";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { useState } from "react";
import FormCheck from "react-bootstrap/FormCheck";
import Spinner from "react-bootstrap/Spinner";
import { useLoadAsync } from "../api/useLoadAsync";
import { useCurrentProject } from "../projects/ProjectContext";
import { getAvailableProjects, getProjectDetails } from "../projects/projects";
import { ShowProject } from "./ShowProject";

export default function DashboardContent() {
  const { project } = useCurrentProject();

  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState<ProjectListFilter>({
    search: "",
    showDeleted: false,
    page: 1,
    count: 10,
  });
  const [showFilter, setShowFilter] = useState(false);

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
    if (project.projectId === "*") {
      console.log(filter);
      // get the list of available projects
      const { list } = await getAvailableProjects(filter);
      projectIds = list.map((p) => p.projectId);
    } else {
      projectIds = [project.projectId];
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
  }, [reload, project.projectId, filter]);

  let content = null;
  if (isLoading) {
    content = (
      <div className="d-flex flex-column justify-content-center align-items-center my-5">
        <Spinner animation="border" variant="secondary" />

        <span className="ms-2 text-muted">Loading Content...</span>
      </div>
    );
  } else if (error) {
    content = (
      <div className="my-3 container">
        <div className="text-center my-2">
          <IconButton
            variant="outline-primary"
            icon="refresh"
            size="sm"
            onClick={() => setReload(reload + 1)}
          >
            Refresh
          </IconButton>
        </div>
        <ShowError error={error} />
      </div>
    );
  } else if (!projectList || projectList.length === 0) {
    content = <div className="my-3 p-4 text-muted">No projects found</div>;
  } else {
    content = projectList.map((project) => (
      <ShowProject key={project.projectId} project={project} />
    ));
  }

  return (
    <div className="p-3">
      {project.projectId === "*" && (
        <div className="d-flex gap-2">
          <div style={{ maxWidth: "30rem" }}>
            <Group prepend="Search">
              <FormInput
                disabled={isLoading}
                value={filter.search || ""}
                onRealChange={(value) =>
                  setFilter({ ...filter, search: value.trim(), page: 1 })
                }
                placeholder="Search..."
              />

              <IconButton
                variant="outline-success"
                icon="check"
                onClick={() => setFilter({ ...filter, page: 1 })}
              />
            </Group>
          </div>

          <IconButton
            variant="outline-secondary"
            icon="filter_list"
            onClick={() => setShowFilter(true)}
          />
          <FilterModal
            show={showFilter}
            onHide={() => setShowFilter(false)}
            filter={filter}
            updateFilter={setFilter}
          />
        </div>
      )}

      {content}
    </div>
  );
}

interface FilterModalProps {
  show: boolean;
  onHide: () => void;

  filter: ProjectListFilter;
  updateFilter: (filter: ProjectListFilter) => void;
}

/**
 * Show the search filter modal
 *
 * @param param0
 * @returns
 */
function FilterModal({ show, onHide, filter, updateFilter }: FilterModalProps) {
  return (
    <SimpleModal
      title="Filter"
      show={show}
      onHide={onHide}
      footer={
        <IconButton variant="secondary" icon="close" onClick={onHide}>
          Close
        </IconButton>
      }
    >
      <div>
        <FormCheck
          label="Show Deleted"
          checked={filter.showDeleted}
          onChange={(e) =>
            updateFilter({ ...filter, showDeleted: e.target.checked })
          }
        />
      </div>
    </SimpleModal>
  );
}
