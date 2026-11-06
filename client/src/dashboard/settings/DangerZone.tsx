import IconButton from "client/components/IconButton";
import { useConfirmModal } from "client/components/modals/useConfirmModal";
import { showToastTop } from "client/components/ToastTop";
import { deleteProject, restoreProject } from "client/projects/projects";
import { unpublishProject } from "client/publish/publishSite";
import { formatDate } from "common/format/date";
import { validEnvironments } from "common/models/projects/Environment";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import Tooltip from "react-bootstrap/Tooltip";

interface DangerZoneProps {
  project: ProjectDetails;

  refreshProject: () => void;
}

/**
 * Danger zone actions (unpublish, delete) for the project.
 *
 * @param param0
 * @returns
 */
export function DangerZone({ project, refreshProject }: DangerZoneProps) {
  const { confirmModal: unpublishModal, showConfirmModal: showUnpublishModal } =
    useConfirmModal({
      title: "Unpublish Project",
      message: `Are you sure you want to unpublish the current live site? The site will go offline immediately.`,
      onConfirm: async () => {
        await unpublishProject(project.projectId);

        // refresh project after unpublish
        refreshProject();

        showToastTop("Sites unpublished!", "unpublished");
      },
      confirmButtonText: "Unpublish",
    });

  const { confirmModal: deleteModal, showConfirmModal: showDeleteModal } =
    useConfirmModal({
      title: "Delete Project",
      message: `Are you sure you want to delete this project? This will schedule a permanent delete of the project.`,
      onConfirm: async () => {
        const result = await deleteProject(project.projectId);

        refreshProject();
        showToastTop(
          `Delete scheduled for ${formatDate(result.purgeDate)}`,
          "auto_delete",
        );
      },
      confirmButtonText: "Delete",
    });

  const { confirmModal: restoreModal, showConfirmModal: showRestoreModal } =
    useConfirmModal({
      title: "Restore Project",
      message: `Are you sure you want to restore this project?`,
      onConfirm: async () => {
        await restoreProject(project.projectId);

        refreshProject();
        showToastTop("Scheduled delete cancelled!", "restore_from_trash");
      },
      confirmButtonText: "Restore",
    });

  return (
    <div className="d-flex gap-2 my-2 justify-content-center">
      {unpublishModal}
      <IconButton
        icon="unpublished"
        variant="warning"
        disabled={
          !validEnvironments.some((env) => {
            return project.publish[env].active;
          })
        }
        tooltip={<Tooltip>Unpublish current live site.</Tooltip>}
        onClick={showUnpublishModal}
      >
        Unpublish Project
      </IconButton>

      {restoreModal}
      {deleteModal}

      {project.deleted.active ? (
        <IconButton icon="restore" variant="info" onClick={showRestoreModal}>
          Restore
        </IconButton>
      ) : (
        <IconButton
          icon="auto_delete"
          variant="danger"
          tooltip={<Tooltip>Schedules a permanent project delete.</Tooltip>}
          onClick={showDeleteModal}
        >
          Delete Project
        </IconButton>
      )}
    </div>
  );
}
