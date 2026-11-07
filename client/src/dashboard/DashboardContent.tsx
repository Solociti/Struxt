import { FormInput } from "client/components/FormInput";
import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { Pagination } from "client/components/Pagination";
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
    count: 5,
  });
  const [showFilter, setShowFilter] = useState(false);

  const { response, isLoading, error } = useLoadAsync(async () => {
    if (!project) {
      return null;
    }

    /**
     * List of project ids to load
     */
    let projectIds: string[] = [];
    let total = 0;

    if (project.projectId === "*") {
      console.log(filter);
      // get the list of available projects
      const { list, total: t } = await getAvailableProjects(filter);
      projectIds = list.map((p) => p.projectId);
      total = t;
    } else {
      projectIds = [project.projectId];
      total = 1;
    }

    /**
     * List of project details to load
     */
    const details: ProjectDetails[] = [];

    for (const projectId of projectIds) {
      const data = await getProjectDetails(projectId);
      details.push(data);
    }
    return { list: details, total };
  }, [reload, project.projectId, filter]);

  const projectList = response?.list;
  const totalResults = response?.total || 0;

  let totalPages = projectList ? Math.ceil(totalResults / filter.count) : 0;

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

      {totalPages > 1 && (
        <div className="d-flex justify-content-center">
          <Pagination
            current={filter.page}
            total={totalPages}
            onPageChange={(p) => setFilter({ ...filter, page: p })}
          />
        </div>
      )}
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
        <Group prepend="Results per Page">
          <FormInput
            type="number"
            value={filter.count.toString()}
            onRealChange={(v) =>
              updateFilter({ ...filter, count: parseInt(v) })
            }
          />
        </Group>

        <hr />

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
