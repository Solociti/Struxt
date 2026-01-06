import { FormInput } from "client/components/FormInput";
import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { ShowError } from "client/components/ShowError";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { useCurrentProject } from "client/projects/ProjectContext";
import { useEffect, useState } from "react";
import { createNewRoutine } from "./routineApis";

/**
 * Modal to create a new routine
 *
 * @param param0
 * @returns
 */
export function NewRoutineModal({
  show,
  onHide,
  defaultPath,
}: {
  show: boolean;
  onHide: () => void;
  defaultPath: string;
}) {
  const [name, setName] = useState("");
  const [path, setPath] = useState(defaultPath);

  const isValid = Boolean(name) && Boolean(path);

  // get the current project details
  const { project } = useCurrentProject();

  const saveCb = useAsyncCallback(async () => {
    await createNewRoutine(project.projectId, {
      name,
      path,
    });
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
      title="Create Routine"
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
      {/* create the routine creation form */}
      <div className="p-3">Create a new routine at the specified path.</div>

      <ShowError error={saveCb.error} />

      <div className="d-flex flex-column gap-3">
        <Group prepend="Name">
          <FormInput
            value={name}
            placeholder="Routine Name"
            name="name"
            onRealChange={(n) => setName(n)}
          />
        </Group>

        {/* TODO: setup a existing paths dropdown */}
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
