import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { ShowError } from "client/components/ShowError";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { useCurrentProject } from "client/projects/ProjectContext";
import { AssetModel } from "common/models/assets/AssetModel";
import { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import { createNewAsset } from "../assetApis";

/**
 * Modal to create a new asset
 *
 * @param param0
 * @returns
 */
export function NewAssetModal({
  show,
  onHide,
  defaultPath,
}: {
  show: boolean;
  onHide: () => void;
  defaultPath: string;
}) {
  const [path, setPath] = useState(defaultPath);
  const name = path.endsWith("/") ? "" : AssetModel.getFileName(path);
  const isValid = Boolean(path) && Boolean(name);

  // get the current project details
  const { project, isSingleProject } = useCurrentProject();

  const saveCb = useAsyncCallback(async () => {
    await createNewAsset(project.projectId, {
      path,
    });
  });

  useEffect(() => {
    if (show) {
      setPath(defaultPath);
    } else {
      saveCb.reset();
    }
  }, [show]);

  // if the current project is not set, don't show the modal
  if (!isSingleProject) {
    return null;
  }

  return (
    <SimpleModal
      title="Create Asset"
      onHide={onHide}
      show={show}
      footer={
        <>
          <IconButton variant="secondary" icon="close" onClick={onHide}>
            Close
          </IconButton>
          <IconButton
            variant="primary"
            icon="save"
            onClick={saveCb.callback}
            disabled={saveCb.isLoading || !isValid}
            spinner={saveCb.isLoading}
          >
            Save
          </IconButton>
        </>
      }
    >
      {/* create the asset creation form */}
      <div className="p-3">Create a new asset at the specified path.</div>

      <ShowError error={saveCb.error} />

      <div className="d-flex flex-column gap-3">
        <Group prepend="Name">
          <Form.Control
            value={path.endsWith("/") ? "" : AssetModel.getFileName(path)}
            placeholder="Asset Name"
            name="name"
            onChange={(event) => {
              const parts = path.split("/");
              parts[parts.length - 1] = event.target.value;
              setPath(parts.join("/"));
            }}
          />
        </Group>

        <Group prepend="Path">
          <Form.Control
            value={path}
            placeholder="/"
            name="path"
            onChange={(event) => setPath(event.target.value)}
          />
        </Group>
      </div>
    </SimpleModal>
  );
}
