import { AutosizeTextArea } from "client/components/AutosizeTextArea";
import IconButton from "client/components/IconButton";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { formatDate } from "common/format/date";
import { PromptOverrides } from "common/models/aiPilot/tools/PromptOverrides";
import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import { saveAiPilotPromptOverride } from "./aiPilotPrompts";
import { ModelItem, VendorItem } from "./helpers";

/**
 * @param param0
 * @returns
 */
export function ShowPromptEditCard({
  override,
  defaultEditMode,
  afterSave,
  afterCancel,
  vendorList,
  modelList,
}: {
  override: PromptOverrides;
  defaultEditMode?: boolean;
  afterSave: (newOverride: PromptOverrides) => void;
  afterCancel?: () => void;
  vendorList: VendorItem[];
  modelList: ModelItem[];
}) {
  const [editOverride, setEditOverride] = useState<null | PromptOverrides>(
    defaultEditMode ? override.clone() : null
  );

  const [deleteOnSave, setDeleteOnSave] = useState(false);

  const handleCancel = () => {
    setEditOverride(null);

    if (afterCancel) {
      afterCancel();
    }
  };

  const handleSave = useAsyncCallback(
    async () => {
      if (!editOverride) {
        return;
      }

      if (deleteOnSave) {
        // mark the override as deleted
        editOverride.archived.active = true;
      }

      // save the override
      await saveAiPilotPromptOverride(editOverride);

      afterSave(editOverride);
      setEditOverride(null);
    },
    {
      toastError: true,
    }
  );

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between">
        <div className="d-flex gap-2">
          {override.isDefault() && !editOverride && (
            <Badge bg="success">Default</Badge>
          )}

          {editOverride && editOverride.isDefault() && (
            <Badge bg="success">Default</Badge>
          )}

          {override.vendors.length > 0 && !editOverride && (
            <Badge bg="primary">{override.vendors.join(", ")}</Badge>
          )}

          {override.models.length > 0 && !editOverride && (
            <Badge bg="secondary">{override.models.join(", ")}</Badge>
          )}
        </div>

        <div>
          <small className="text-muted">
            Created by {override.created.displayName || "Unknown"} on{" "}
            {formatDate(override.created.date)}
          </small>
        </div>
      </Card.Header>

      <Card.Body>
        {editOverride && (
          <>
            {deleteOnSave && (
              <Alert variant="danger">
                Save this prompt override to complete the deletion.
              </Alert>
            )}

            <h4>Vendors</h4>
            <RadioGrid
              selected={editOverride.vendors}
              onChange={(list) => {
                const updated = editOverride.clone();
                updated.vendors = list;
                setEditOverride(updated);
              }}
              options={vendorList}
            />

            <h4 className="mt-4">Models</h4>
            <RadioGrid
              selected={editOverride.models}
              onChange={(list) => {
                const updated = editOverride.clone();
                updated.models = list;
                setEditOverride(updated);
              }}
              options={modelList.map((m) => ({
                id: m.id,
                name: (
                  <div className="d-flex justify-content-between gap-1">
                    <div>{m.name} </div>
                    <small className="text-muted text-capitalize">
                      {m.vendorId}
                    </small>
                  </div>
                ),
              }))}
            />
            <hr />
          </>
        )}

        {editOverride ? (
          <AutosizeTextArea
            value={editOverride.prompt}
            placeholder="Prompt text."
            maxRows={10}
            className="border-0 shadow-none"
            onRealChange={(value) => {
              const updated = editOverride.clone();
              updated.prompt = value;
              setEditOverride(updated);
            }}
          />
        ) : (
          <p className="my-2">{override.prompt}</p>
        )}
      </Card.Body>

      <Card.Footer className="d-flex justify-content-between">
        <div>
          {editOverride && editOverride.uuid !== "new" && (
            <IconButton
              variant="danger"
              icon="delete"
              className="mx-2"
              onClick={() => setDeleteOnSave(!deleteOnSave)}
            >
              Delete
            </IconButton>
          )}
        </div>

        {editOverride ? (
          <div>
            <IconButton
              variant="secondary"
              icon="cancel"
              className="mx-2"
              onClick={handleCancel}
            >
              Cancel
            </IconButton>

            <IconButton
              variant="success"
              icon="save"
              className="me-2"
              disabled={handleSave.isLoading}
              onClick={handleSave.callback}
            >
              Save
            </IconButton>
          </div>
        ) : (
          <IconButton
            variant="outline-primary"
            icon="edit"
            onClick={() => {
              // enter edit mode
              setEditOverride(override.clone());
            }}
          >
            Edit
          </IconButton>
        )}
      </Card.Footer>
    </Card>
  );
}

function RadioGrid({
  selected,
  options,
  onChange,
}: {
  selected: string[];
  options: { id: string; name: string | React.ReactNode }[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="d-flex flex-wrap">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);

        const bg = isSelected ? "bg-primary" : "";

        return (
          <div
            key={opt.id}
            className={`flex-grow-1 cursor-pointer ${bg} border py-2 px-3`}
            onClick={() => {
              if (isSelected) {
                onChange(selected.filter((v) => v !== opt.id));
              } else {
                const list = [...selected, opt.id];
                onChange(list);
              }
            }}
          >
            {opt.name}
          </div>
        );
      })}
    </div>
  );
}
