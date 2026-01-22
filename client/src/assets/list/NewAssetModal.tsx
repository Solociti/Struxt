import { FormInput } from "client/components/FormInput";
import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { ShowError } from "client/components/ShowError";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { useCurrentProject } from "client/projects/ProjectContext";
import { useEffect, useState } from "react";
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
  const [name, setName] = useState("");
  // Assets might just use a flat list or folders.
  // The UI implies folders.
  const [path, setPath] = useState(defaultPath);

  const isValid = Boolean(name) && Boolean(path);

  // get the current project details
  const { project } = useCurrentProject();

  const saveCb = useAsyncCallback(async () => {
    // Determine the full path?
    // Is the API expecting 'path' to be the folder or full file path?
    // In routines it sent { name, path }.
    // Let's assume createNewAsset handles it.
    await createNewAsset(project.projectId, {
      displayName: name,
      path: path.endsWith("/") ? `${path}${name}` : `${path}/${name}`,
    });
    // Wait, let's verify register.ts.
    // It uses multer upload: router.post("/upload/:projectId", ...)
    // There is no explicit "create empty file" endpoint in register.ts yet!
    // It only has upload.
    // The user said: "The routines stored the file contents in the json structure. The new Assets model, stores the file contents on disk... There is an endpoint where we need use a PUT to update the file contents."
    // But how do we CREATE a new empty file?
    // The user didn't specify.
    // I should probably use the same PUT endpoint with a new UUID?
    // Or maybe the upload endpoint?
    // Or I should stub this out for now since the backend might not support "create empty" yet.
    // However, I can try to simulate it or just leave it for now.
    // Re-reading `register.ts`:
    // It has `POST /upload/:projectId`.
    // It does NOT have a create single file endpoint.
    // Existing `Routines` had `create-file`.
    // I will comment out the implementation and show an error or TODO.
    throw new Error(
      "Creating new assets is not yet supported. Please upload files instead.",
    );
  });

  useEffect(() => {
    if (show) {
      setPath(defaultPath);
      setName("");
    } else {
      setName("");
      saveCb.reset();
    }
  }, [show]);

  // if the current project is not set, don't show the modal
  if (!project.projectId || project.projectId === "*") {
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
          <FormInput
            value={name}
            placeholder="Asset Name"
            name="name"
            onRealChange={(n) => setName(n)}
          />
        </Group>

        <Group prepend="Path">
          <FormInput
            value={path}
            placeholder="/"
            name="path"
            onRealChange={(p) => setPath(p)}
          />
        </Group>
      </div>
    </SimpleModal>
  );
}
