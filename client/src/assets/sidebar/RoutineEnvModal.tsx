import { AutosizeTextArea } from "client/components/AutosizeTextArea";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { useConfirmModal } from "client/components/modals/useConfirmModal";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import {
  deleteProjectRoutinesEnv,
  updateProjectRoutinesEnv,
} from "client/projects/routineEnv";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { ProjectFeatureFlags } from "common/models/projects/ProjectModel";
import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import { useState } from "react";
import Form from "react-bootstrap/Form";

export interface EditRoutineEnvModalProps {
  show: boolean;
  onHide: () => void;
  env: RoutineEnvModel;
  project: ProjectDetails;
  envSettings: ProjectFeatureFlags["routines"]["environments"][number];
  onSave: (details: ProjectDetails) => void;
}

export function EditRoutineEnvModal({
  show,
  onHide,
  env,
  project,
  envSettings,
  onSave,
}: EditRoutineEnvModalProps) {
  const [files, setFiles] = useState(envSettings.files.join("\n"));
  const [ignore, setIgnore] = useState(envSettings.ignore.join("\n"));

  const handleDelete = useAsyncCallback(async () => {
    const { details } = await deleteProjectRoutinesEnv(
      project.projectId,
      envSettings.uuid,
    );

    onSave(details);
    onHide();
  });

  const { confirmModal, showConfirmModal } = useConfirmModal({
    title: "Remove Routine Environment",
    message: `Are you sure you want to remove the "${env.displayName}" routine environment?`,
    onConfirm: handleDelete.callback,
    confirmButtonText: "Remove",
  });

  const handleSave = useAsyncCallback(async () => {
    const splitPattern = /[,\n]+/;

    const { details } = await updateProjectRoutinesEnv(project.projectId, {
      ...envSettings,
      files: files
        .split(splitPattern)
        .map((f) => f.trim())
        .filter(Boolean),
      ignore: ignore
        .split(splitPattern)
        .map((f) => f.trim())
        .filter(Boolean),
    });

    onSave(details);
    onHide();
  });

  return (
    <SimpleModal
      show={show}
      onHide={onHide}
      title={`Edit ${env.displayName} Environment`}
      footer={
        <>
          <div className="flex-grow-1 text-start">
            <IconButton
              icon="delete"
              variant="outline-warning"
              onClick={showConfirmModal}
              disabled={handleDelete.isLoading}
            >
              Remove
            </IconButton>
          </div>
          {confirmModal}

          <IconButton icon="close" variant="secondary" onClick={onHide}>
            Close
          </IconButton>
          <IconButton
            icon="save"
            variant="primary"
            onClick={handleSave.callback}
            disabled={handleSave.isLoading}
          >
            Save
          </IconButton>
        </>
      }
    >
      <Form.Group className="mb-3">
        <Form.Label>Include Files</Form.Label>
        <Form.Text className="text-muted d-block mb-2">
          Glob patterns separated by line breaks or commas.
        </Form.Text>
        <AutosizeTextArea
          value={files}
          onRealChange={setFiles}
          placeholder={"src/**/*.js\npackage.json"}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Ignore Files</Form.Label>
        <Form.Text className="text-muted d-block mb-2">
          Glob patterns to exclude from deployment.
        </Form.Text>
        <AutosizeTextArea
          value={ignore}
          onRealChange={setIgnore}
          placeholder={"node_modules/**\n.git/**"}
        />
      </Form.Group>
    </SimpleModal>
  );
}
