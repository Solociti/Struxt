import { useLoadAsync } from "client/api/useLoadAsync";
import { getAiPilotModels, saveAiPilotModel } from "./aiPilotModels";
import Spinner from "react-bootstrap/Spinner";
import { ShowError } from "client/components/ShowError";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import { roundNumber } from "common/format/number";
import IconButton from "client/components/IconButton";
import { AiPilotModel } from "common/models/aiPilot/AiPilotModels";
import SimpleModal from "client/components/modals/SimpleModal";
import Group from "client/components/Group";
import { FormInput } from "client/components/FormInput";
import { useEffect, useState } from "react";
import { formatDate } from "common/format/date";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { DeepPartial } from "common/models/utils";
import Alert from "react-bootstrap/Alert";

/**
 * Show the list of AI Pilot models
 *
 * @returns
 */
export function ShowAiPilotModels() {
  const { error, isLoading, response, reload } = useLoadAsync(async () => {
    const models = await getAiPilotModels();
    return models;
  }, []);

  const list = response || [];

  const [editModel, setEditModel] = useState<AiPilotModel | null>(null);

  return (
    <Card className="my-4">
      <Card.Header
        as="div"
        className="d-flex align-items-center justify-content-between"
      >
        <h4 className="my-0">AI Pilot Models</h4>

        <div>
          <IconButton
            icon="add"
            variant="success"
            size="sm"
            onClick={() => setEditModel(new AiPilotModel())}
          >
            New Model
          </IconButton>
        </div>
      </Card.Header>
      <Card.Body className="d-flex gap-2 justify-content-around flex-wrap">
        {isLoading && <Spinner animation="border" size="sm" />}
        <ShowError error={error} />

        {list.map((model, index) => (
          <Card key={index} style={{ minWidth: "18rem" }}>
            <Card.Header
              as="div"
              className="d-flex justify-content-between align-items-center gap-2"
            >
              <h5 className="my-0">{model.vendor}</h5>
              <h4 className="my-0">{model.modelName}</h4>
            </Card.Header>

            <Card.Body>
              <div className="d-flex gap-2 align-items-center justify-content-around">
                {model.disabled.active && (
                  <Badge bg="secondary">Disabled</Badge>
                )}
                {model.isDefault && <Badge bg="primary">Default</Badge>}

                <Badge bg="success">
                  {roundNumber(model.tokenMultiplier, 2)}x
                </Badge>
              </div>
            </Card.Body>

            <Card.Footer className="text-end">
              <IconButton
                icon="edit"
                variant="outline-primary"
                size="sm"
                onClick={() => setEditModel(model)}
              >
                Edit
              </IconButton>
            </Card.Footer>
          </Card>
        ))}

        <EditModal
          show={Boolean(editModel)}
          onHide={() => setEditModel(null)}
          model={editModel}
          afterSave={() => reload()}
        />
      </Card.Body>
    </Card>
  );
}

function EditModal({
  model: originalModel,
  show,
  onHide,
  afterSave,
}: {
  model: null | AiPilotModel;
  show: boolean;
  onHide: () => void;
  afterSave: () => void;
}) {
  const [showSaveWarn, setShowSaveWarn] = useState(false);
  const [editModel, setEditModel] = useState<AiPilotModel | null>(null);

  useEffect(() => {
    setEditModel(originalModel ? originalModel.clone() : null);
    setShowSaveWarn(false);
  }, [originalModel]);

  const updateValue = (updatedFields: DeepPartial<AiPilotModel>) => {
    if (!editModel) {
      return;
    }

    const _model = editModel.clone();
    _model.update(updatedFields);
    setEditModel(_model);
  };

  const handleSave = useAsyncCallback(
    async () => {
      if (!editModel) {
        return;
      }

      await saveAiPilotModel(editModel);

      afterSave();
      onHide();
    },
    {
      toastError: true,
    }
  );

  return (
    <SimpleModal
      show={show}
      onHide={onHide}
      title="Edit Model"
      footer={
        <>
          <IconButton icon="close" variant="secondary" onClick={onHide}>
            Cancel
          </IconButton>
          <IconButton
            icon="save"
            variant="primary"
            disabled={!editModel || handleSave.isLoading}
            spinner={handleSave.isLoading}
            onClick={handleSave.callback}
          >
            Save
          </IconButton>
        </>
      }
    >
      {showSaveWarn && (
        <Alert variant="info">Save the model to apply the status change.</Alert>
      )}

      {editModel ? (
        <div className="d-flex flex-column gap-3">
          <div className="text-center">
            Created: {formatDate(editModel.created.date)}
          </div>

          <Group prepend="ID">
            <FormInput
              type="text"
              value={editModel.id}
              onRealChange={(value) =>
                updateValue({
                  id: value,
                })
              }
            />
          </Group>

          <Group prepend="Vendor">
            <FormInput
              type="text"
              value={editModel.vendor}
              onRealChange={(value) => updateValue({ vendor: value })}
            />
          </Group>

          <Group prepend="Model Name">
            <FormInput
              type="text"
              value={editModel.modelName}
              onRealChange={(value) => updateValue({ modelName: value })}
            />
          </Group>

          <Group prepend="Token Multiplier">
            <FormInput
              type="number"
              value={editModel.tokenMultiplier.toString()}
              onRealChange={(value) =>
                updateValue({ tokenMultiplier: parseFloat(value) })
              }
            />
          </Group>

          <hr className="my-2" />

          <div className="d-flex gap-2 justify-content-center">
            <IconButton
              icon="star"
              iconProps={{
                filled: editModel.isDefault,
              }}
              variant={
                editModel.isDefault ? "outline-success" : "outline-secondary"
              }
              size="sm"
              disabled={editModel.isDefault}
              onClick={() => {
                updateValue({ isDefault: true });
                setShowSaveWarn(true);
              }}
            >
              {editModel.isDefault ? "" : "Set "}Default
            </IconButton>

            <IconButton
              icon={editModel.disabled.active ? "check" : "close"}
              variant={
                editModel.disabled.active
                  ? "outline-success"
                  : "outline-warning"
              }
              size="sm"
              disabled={editModel.isDefault}
              onClick={() => {
                updateValue({
                  disabled: { active: !editModel.disabled.active },
                });
                setShowSaveWarn(true);
              }}
            >
              {editModel.disabled.active ? "Enable" : "Disable"} Model
            </IconButton>
          </div>
        </div>
      ) : (
        <div className="text-center my-3">
          <Spinner animation="border" />
        </div>
      )}
    </SimpleModal>
  );
}
