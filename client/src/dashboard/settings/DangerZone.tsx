import IconButton from "client/components/IconButton";
import { useConfirmModal } from "client/components/modals/useConfirmModal";
import { useCurrentProject } from "client/projects/ProjectContext";
import Tooltip from "react-bootstrap/Tooltip";

export function DangerZone({}) {
  const { project } = useCurrentProject();

  const { confirmModal: unpublishModal, showConfirmModal: showUnpublishModal } =
    useConfirmModal({
      title: "Unpublish Project",
      message: `Are you sure you want to unpublish the current live site? The site will go offline immediately.`,
      onConfirm: () => {},
      confirmButtonText: "Unpublish",
    });

  const { confirmModal: deleteModal, showConfirmModal: showDeleteModal } =
    useConfirmModal({
      title: "Delete Project",
      message: `Are you sure you want to delete this project? This will schedule a permanent delete of the project.`,
      onConfirm: () => {},
      confirmButtonText: "Delete",
    });

  return (
    <div className="d-flex gap-2 my-2 justify-content-center">
      {unpublishModal}
      <IconButton
        icon="close"
        variant="warning"
        tooltip={<Tooltip>Unpublish current live site.</Tooltip>}
        onClick={showUnpublishModal}
      >
        Unpublish Project
      </IconButton>

      {deleteModal}
      <IconButton
        icon="delete"
        variant="danger"
        tooltip={<Tooltip>Schedules a permanent project delete.</Tooltip>}
        onClick={showDeleteModal}
      >
        Delete Project
      </IconButton>
    </div>
  );
}
