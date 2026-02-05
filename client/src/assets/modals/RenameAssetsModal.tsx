import { addToastInfo, addToastWarning } from "client/components/ErrorSnackBar";
import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import SimpleModal from "client/components/modals/SimpleModal";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { AssetMoveApi } from "common/api/assets/assets";
import { AssetListItem } from "common/models/assets/AssetModel";
import { reWriteAssetPath } from "common/models/assets/reWriteAssetPath";
import { basename, dirname, join, normalize } from "common/path/path";
import { useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import { moveAssets } from "../assetApis";
import { useContentManager } from "../cm/contentManager";
import { DisplayAssetsList } from "./DisplayAssetsList";

/**
 * Modal to rename a asset.
 * When a directory is renamed all child assets are renamed too.
 *
 * @returns
 */
export function RenameAssetsModal() {
  const { commands, project } = useContentManager();

  const [show, setShow] = useState(false);
  const [items, setItems] = useState<AssetListItem[]>([]);
  const [originalPath, setOriginalPath] = useState<string>("");

  const isDir = originalPath.endsWith("/");
  const originalName = basename(originalPath);

  const [newName, setNewName] = useState("");
  const newPath =
    normalize(join(dirname(originalPath), newName)) + (isDir ? "/" : "");

  const [conflictResolution, setConflictResolution] =
    useState<AssetMoveApi["PostBody"]["onConflict"]>("skip");

  useEffect(() => {
    const unregisterShow = commands.on("rename:show", (items, itemPath) => {
      setItems(items);
      setOriginalPath(itemPath);
      setShow(true);

      setNewName(basename(itemPath));
    });

    const unregisterHide = commands.on("rename:hide", () => {
      setShow(false);
      setOriginalPath("");
      setItems([]);
      setNewName("");
    });

    return () => {
      unregisterShow();
      unregisterHide();
    };
  }, []);

  const renameCb = useAsyncCallback(
    async () => {
      if (items.length === 0) {
        return;
      }

      const result = await moveAssets(
        project.projectId,
        items.map((item) => ({ uuid: item.uuid })),
        originalPath,
        newPath,
        conflictResolution,
      );

      if (result.completed.length === 0 && result.skipped.length > 0) {
        addToastWarning(
          "Rename Failed",
          `Could not rename asset(s) due to naming conflicts.`,
        );
      } else if (result.skipped.length > 0) {
        addToastInfo(
          "Rename Partial Success",
          `${result.skipped.length} asset(s) were skipped due to naming conflicts.`,
        );
      }

      commands.trigger("rename", result);

      if (result.completed.length > 0) {
        commands.trigger("rename:hide");
      }
    },
    {
      toastError: true,
    },
  );

  return (
    <SimpleModal
      title="Rename Asset"
      footer={
        <>
          <IconButton
            icon="close"
            variant="secondary"
            onClick={() => commands.trigger("rename:hide")}
          >
            Cancel
          </IconButton>
          <IconButton
            icon="check"
            variant="primary"
            disabled={newName.trim().length === 0 || renameCb.isLoading}
            spinner={renameCb.isLoading}
            onClick={renameCb.callback}
          >
            Rename
          </IconButton>
        </>
      }
      show={show}
      onHide={() => setShow(false)}
    >
      <div className="d-flex flex-column gap-3">
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div className="text-muted">{originalPath}</div>
          <div>
            <MaterialIcon style={{ fontSize: "1.25rem" }}>
              arrow_forward
            </MaterialIcon>
          </div>
          <div>
            <strong>{newPath}</strong>
          </div>
        </div>

        <Group prepend="Name">
          <Form.Control
            value={newName}
            placeholder={originalName}
            name="name"
            onChange={(event) => {
              setNewName(event.target.value);
            }}
          />
        </Group>

        <Group prepend="On Conflict">
          <Dropdown
            onSelect={(key) => {
              setConflictResolution(
                key as AssetMoveApi["PostBody"]["onConflict"],
              );
            }}
          >
            <Dropdown.Toggle
              variant="outline-secondary"
              style={{ textTransform: "capitalize", minWidth: "10em" }}
            >
              {conflictResolution}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item eventKey="skip">Skip</Dropdown.Item>
              <Dropdown.Item eventKey="overwrite">Overwrite</Dropdown.Item>
              <Dropdown.Item eventKey="rename">Rename</Dropdown.Item>
              <Dropdown.Item eventKey="throw">Skip All</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Group>

        {/* List of affected assets */}
        {isDir && (
          <div className="mt-4">
            <h5>Affected Assets:</h5>
            <DisplayAssetsList
              list={items.map((asset) => {
                const updated = reWriteAssetPath(
                  asset.path,
                  originalPath,
                  newPath,
                );

                return {
                  ...asset,
                  path: updated,
                };
              })}
            />
          </div>
        )}
      </div>
    </SimpleModal>
  );
}
