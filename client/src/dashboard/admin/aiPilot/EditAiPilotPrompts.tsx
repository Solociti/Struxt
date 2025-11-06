import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { AiPilotPrompts } from "common/models/aiPilot/tools/AiPilotPrompts";
import { PromptOverrides } from "common/models/aiPilot/tools/PromptOverrides";
import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import { getPromptKeyName, ModelItem, VendorItem } from "./helpers";
import { ShowPromptEditCard } from "./ShowPromptEditCard";

/**
 * Edit the prompts for a specific key
 *
 * @param param0
 * @returns
 */
export function EditAiPilotPrompts({
  promptKey,
  onClose,
  onUpdate,
  defaultPrompts,
  prompts,
  overrides,
  vendorList,
  modelList,
}: {
  promptKey?: PromptOverrides["key"] | "";
  onClose: () => void;
  onUpdate: () => void;
  prompts: AiPilotPrompts;
  defaultPrompts: AiPilotPrompts;
  overrides: PromptOverrides[];
  vendorList: VendorItem[];
  modelList: ModelItem[];
}) {
  const show = Boolean(promptKey);

  const matchingOverrides = overrides.filter((o) => o.key === promptKey);

  const [editNewPrompt, setEditNewPrompt] = useState<null | PromptOverrides>(
    null
  );

  useEffect(() => {
    if (!show) {
      setEditNewPrompt(null);
    }
  }, [show]);

  const title = getPromptKeyName(promptKey || "agentPrompt");

  return (
    <SimpleModal
      show={show}
      onHide={onClose}
      title={
        <>
          {title.title}{" "}
          {title.subTitle && (
            <small className="text-muted">.{title.subTitle}</small>
          )}
        </>
      }
      size="xl"
      footer={
        <>
          <IconButton variant="secondary" icon="close" onClick={onClose}>
            Close
          </IconButton>
        </>
      }
    >
      <Card>
        <Card.Header className="d-flex justify-content-between">
          <h5 className="my-0">Original Prompt</h5>

          {promptKey &&
            defaultPrompts.getPrompt(promptKey) ===
              prompts.getPrompt(promptKey) && (
              <Badge bg="success">Default</Badge>
            )}
        </Card.Header>
        <Card.Body>
          <p className="my-2">
            {promptKey && defaultPrompts.getPrompt(promptKey)}
          </p>
        </Card.Body>
      </Card>

      <hr />

      <div className="d-flex justify-content-end my-3">
        <IconButton
          variant="primary"
          icon="add"
          onClick={() => {
            if (!promptKey) {
              return;
            }

            setEditNewPrompt(
              new PromptOverrides({ uuid: "new", key: promptKey })
            );
          }}
        >
          Override
        </IconButton>
      </div>

      {/* show the list of overrides */}
      {matchingOverrides.length === 0 && (
        <Alert variant="info">No overrides for this prompt</Alert>
      )}

      {editNewPrompt && (
        <ShowPromptEditCard
          override={editNewPrompt}
          defaultEditMode
          vendorList={vendorList}
          modelList={modelList}
          afterCancel={() => {
            setEditNewPrompt(null);
          }}
          afterSave={() => {
            setEditNewPrompt(null);
            onUpdate();
          }}
        />
      )}

      {matchingOverrides.map((o, index) => (
        <ShowPromptEditCard
          key={index}
          override={o}
          vendorList={vendorList}
          modelList={modelList}
          afterSave={onUpdate}
        />
      ))}
    </SimpleModal>
  );
}
