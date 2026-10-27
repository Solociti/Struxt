import { AutosizeTextArea } from "client/components/AutosizeTextArea";
import { FormInput } from "client/components/FormInput";
import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import {
  defaultFilesForRuntime,
  FissionRuntimes,
  fissionRuntimes,
} from "common/models/routines/runtimes";
import { DeepPartial } from "common/models/utils";
import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import { saveRoutineEnv } from "./routineEnvApi";

export function RoutineEnvEditModal({
  env: originalEnv,
  show,
  onHide,
  afterSave,
}: {
  env: RoutineEnvModel | null;
  show: boolean;
  onHide: () => void;
  afterSave: () => void;
}) {
  const [editEnv, setEditEnv] = useState<RoutineEnvModel | null>(null);

  useEffect(() => {
    setEditEnv(originalEnv ? originalEnv.clone() : null);
  }, [originalEnv]);

  const updateValue = (fields: DeepPartial<RoutineEnvModel>) => {
    if (!editEnv) {
      return;
    }

    const clone = editEnv.clone();
    clone.update(fields);
    setEditEnv(clone);
  };

  const handleSave = useAsyncCallback(
    async () => {
      if (!editEnv) {
        return;
      }

      await saveRoutineEnv(editEnv);
      afterSave();
      onHide();
    },
    { toastError: true },
  );

  const isNew = !originalEnv?.uuid;

  return (
    <SimpleModal
      show={show}
      onHide={onHide}
      title={isNew ? "New Environment" : "Edit Environment"}
      size="lg"
      modalProps={{
        scrollable: true,
      }}
      footer={
        <div className="d-flex w-100 justify-content-between align-items-center">
          <div>
            {editEnv && (
              <IconButton
                icon={editEnv.disabled.active ? "check" : "close"}
                variant={
                  editEnv.disabled.active
                    ? "outline-success"
                    : "outline-warning"
                }
                size="sm"
                disabled={editEnv.isDefault}
                onClick={() => {
                  updateValue({
                    disabled: {
                      active: !editEnv.disabled.active,
                      date: Date.now(),
                    },
                  });
                }}
              >
                {editEnv.disabled.active ? "Enable" : "Disable"}
              </IconButton>
            )}
          </div>

          <div className="d-flex gap-2">
            <IconButton icon="close" variant="secondary" onClick={onHide}>
              Cancel
            </IconButton>
            <IconButton
              icon="save"
              variant="primary"
              disabled={!editEnv || handleSave.isLoading}
              spinner={handleSave.isLoading}
              onClick={handleSave.callback}
            >
              Save
            </IconButton>
          </div>
        </div>
      }
    >
      <div className="mb-3 text-muted">
        <p className="mb-2">
          Fission environments are pre-created on the K3s cluster by an admin.
          Struxt only references them by name, it does not manage their
          lifecycle.
        </p>
        <p className="mb-1">
          Create an environment on the cluster with the Fission CLI using:
        </p>
        <pre className="mb-2 p-2 rounded small bg-darken-2">
          fission env create --name example-env
        </pre>

        <br />
        <p className="mb-1">
          The <code>name</code> field below must exactly match the name used in
          the <code>--name</code> flag above. List existing environments with:
        </p>
        <pre className="mb-0 p-2 rounded small bg-darken-2">
          fission env list
        </pre>
      </div>

      {editEnv && <ModalContent editEnv={editEnv} updateValue={updateValue} />}
    </SimpleModal>
  );
}

function ModalContent({
  editEnv,
  updateValue,
}: {
  editEnv: RoutineEnvModel;
  updateValue: (fields: DeepPartial<RoutineEnvModel>) => void;
}) {
  return (
    <>
      {editEnv.disabled.active && (
        <Alert variant="warning">
          <p className="mb-0">
            A disabled environment will prevent any routines using it from being
            deployed.
          </p>
        </Alert>
      )}

      <div className="d-flex flex-column gap-3 mt-3">
        <Group prepend="Name">
          <FormInput
            type="text"
            placeholder="node-22"
            value={editEnv.name}
            onRealChange={(value) => updateValue({ name: value })}
          />
        </Group>

        <Group prepend="Display Name">
          <FormInput
            type="text"
            placeholder="Node.js 22"
            value={editEnv.displayName}
            onRealChange={(value) => updateValue({ displayName: value })}
          />
        </Group>

        <Group prepend="Runtime">
          <Form.Select
            value={editEnv.runtime}
            onChange={(e) => {
              const runtime = e.target.value as FissionRuntimes;

              const files = defaultFilesForRuntime(runtime);

              updateValue({
                runtime: e.target.value as FissionRuntimes,
                files,
              });
            }}
          >
            {fissionRuntimes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Form.Select>
        </Group>

        <Group prepend="Files">
          <AutosizeTextArea
            placeholder="routines/**/*.js
routines/**/*.json"
            value={editEnv.files.join("\n")}
            onRealChange={(value) =>
              updateValue({
                files: value
                  .split("\n")
                  .map((s) => s.split(",").map((t) => t.trim()))
                  .flat(2)
                  .filter(Boolean),
              })
            }
            maxRows={10}
          />
        </Group>

        <Group prepend="Ignore">
          <AutosizeTextArea
            placeholder="**/*.test.js"
            value={editEnv.ignore.join("\n")}
            onRealChange={(value) =>
              updateValue({
                ignore: value
                  .split("\n")
                  .map((s) => s.split(",").map((t) => t.trim()))
                  .flat(2)
                  .filter(Boolean),
              })
            }
            maxRows={10}
          />
        </Group>

        <div className="d-flex justify-content-center">
          <IconButton
            icon="star"
            iconProps={{ filled: editEnv.isDefault }}
            variant={
              editEnv.isDefault ? "outline-success" : "outline-secondary"
            }
            size="sm"
            disabled={editEnv.isDefault || editEnv.disabled.active}
            onClick={() => updateValue({ isDefault: true })}
          >
            {editEnv.isDefault ? "Default" : "Set Default"}
          </IconButton>
        </div>
      </div>
    </>
  );
}
