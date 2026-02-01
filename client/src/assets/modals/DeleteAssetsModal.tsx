import { useCurrentUser } from "client/auth/userCurrentUser";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { deleteAssets } from "client/projects/assets";
import { AssetListItem, AssetModel } from "common/models/assets/AssetModel";
import { getFileExtension } from "common/models/assets/FileExtensions";
import { roles } from "common/models/user/Roles";
import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import ListGroup from "react-bootstrap/ListGroup";
import { useContentManager } from "../cm/contentManager";
import { FileIcon } from "../list/FileIcon";

/**
 * Creates a modal to confirm the deletion of assets.
 *
 * @returns
 */
export function DeleteAssetsModal() {
  const { project, commands } = useContentManager();

  const [show, setShow] = useState(false);
  const [items, setItems] = useState<AssetListItem[]>([]);
  const [isPermanent, setIsPermanent] = useState(false);

  const user = useCurrentUser();
  const hasPermission = isPermanent
    ? user.hasProjectPermission(project.projectId, roles.projects.admin)
    : user.hasProjectPermission(project.projectId, roles.projects.edit);

  useEffect(() => {
    const unregisterShow = commands.on("delete:show", (items, isPermanent) => {
      setItems(items);
      setShow(true);
      setIsPermanent(isPermanent);
    });
    const unregisterHide = commands.on("delete:hide", () => {
      setItems([]);
      setShow(false);
    });

    return () => {
      unregisterShow();
      unregisterHide();
    };
  }, []);

  const deleteCb = useAsyncCallback(async () => {
    // delete the assets
    const result = await deleteAssets(
      project.projectId,
      items.map((item) => ({ uuid: item.uuid, isPermanent })),
    );

    // trigger the delete completed events
    commands.trigger("delete", result);
    commands.trigger("delete:hide");

    // close the tabs
    for (const item of items) {
      commands.trigger("tabs:close", item.uuid);
    }
  }, {});

  return (
    <SimpleModal
      title={isPermanent ? "Permanently Delete Assets" : "Delete Assets"}
      show={show}
      onHide={() => commands.trigger("delete:hide")}
      footer={
        <>
          <IconButton
            variant="secondary"
            icon="close"
            onClick={() => commands.trigger("delete:hide")}
          >
            Close
          </IconButton>
          <IconButton
            variant={isPermanent ? "danger" : "warning"}
            icon={isPermanent ? "delete_forever" : "delete"}
            onClick={deleteCb.callback}
            disabled={!hasPermission || deleteCb.isLoading}
            spinner={deleteCb.isLoading}
          >
            {isPermanent ? "Delete" : "Trash"}
          </IconButton>
        </>
      }
    >
      <div>
        {!hasPermission ? (
          <Alert variant="warning">
            You do not have the correct permissions to
            {isPermanent ? " permanently" : ""} delete assets.
          </Alert>
        ) : isPermanent ? (
          <p>
            Are you sure you want to permanently delete the following assets?
          </p>
        ) : (
          <p>Are you sure you want to send the following assets to trash?</p>
        )}

        <ListGroup>
          {items.map((item) => {
            const fileName = AssetModel.getFileName(item.path);
            const extension = getFileExtension(fileName);
            const path = AssetModel.getBasePath(item.path);

            return (
              <ListGroup.Item key={item.uuid} title={item.path}>
                <div className="d-flex align-items-center">
                  <FileIcon extension={extension} />
                  <div className="ms-2 text-truncate text-muted">
                    {path.slice(0, -6)}
                  </div>
                  <div className="text-muted">{path.slice(-6)}</div>
                  <div>{fileName}</div>
                </div>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </div>
    </SimpleModal>
  );
}
