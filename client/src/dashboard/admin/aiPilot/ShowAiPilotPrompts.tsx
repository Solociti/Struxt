import { useLoadAsync } from "client/api/useLoadAsync";
import IconButton from "client/components/IconButton";
import { ShowError } from "client/components/ShowError";
import { ToolKeys } from "common/api/aiPilot/toolNames";
import { AiPilotPrompts } from "common/models/aiPilot/tools/AiPilotPrompts";
import { PromptOverrides } from "common/models/aiPilot/tools/PromptOverrides";
import { useState } from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import { getAiPilotPrompts } from "./aiPilotPrompts";
import { EditAiPilotPrompts } from "./EditAiPilotPrompts";
import {
  extractVendorsAndModels,
  getPromptKeyName,
  ModelItem,
  VendorItem,
} from "./helpers";
import { ModelSelectionDropdowns } from "./ModelSelectionDropdown";

/**
 * Show the list of AI Pilot prompts.
 *
 * This is an admin only view.
 *
 * @returns
 */
export function ShowAiPilotPrompts() {
  const { error, isLoading, response, reload } = useLoadAsync(async () => {
    const {
      defaultPrompts: originalPrompts,
      overrides,
      models,
    } = await getAiPilotPrompts();

    return {
      originalPrompts,
      overrides,
      models,
    };
  }, []);

  const { vendorList, modelList } = extractVendorsAndModels(
    response ? response.models : []
  );

  /**
   * Keep track of the ai vendor and models selected for previewing prompts
   */
  const [selectedVendor, setSelectedVendor] = useState<VendorItem>({
    id: "",
    name: "Default",
  });
  const [selectedModel, setSelectedModel] = useState<ModelItem>({
    id: "",
    name: "Default",
    vendorId: "",
  });

  /**
   * The default prompts with the overrides applied for the selected vendor and model
   */
  const defaultPrompts = (() => {
    if (!response) {
      return new AiPilotPrompts();
    }

    const { originalPrompts, overrides } = response;

    // apply the overrides to the default prompts
    const defaultPrompts = originalPrompts.clone();
    defaultPrompts.applyOverrides(
      overrides,
      selectedVendor.id,
      selectedModel.id
    );

    return defaultPrompts;
  })();

  const [editPromptKey, setEditPromptKey] = useState<
    PromptOverrides["key"] | ""
  >("");

  return (
    <Card className="my-4">
      <Card.Header
        as="div"
        className="d-flex align-items-center justify-content-between"
      >
        <h4 className="my-0">AI Pilot Prompts</h4>

        <div>
          {/* show the vendor and model dropdowns to allow selecting what prompts you want to view */}
          <ModelSelectionDropdowns
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedVendor={selectedVendor}
            setSelectedVendor={setSelectedVendor}
            vendorList={vendorList}
            modelList={modelList}
          />
        </div>
      </Card.Header>
      <Card.Body className="d-flex gap-2 justify-content-around flex-wrap">
        {isLoading && <Spinner animation="border" size="sm" />}
        <ShowError error={error} />

        <ListGroup className="w-100">
          <ViewPromptItem
            promptKey="agentPrompt"
            prompts={defaultPrompts}
            onEdit={setEditPromptKey}
          />
        </ListGroup>

        <h4 className="my-2">Tools</h4>
        <ListGroup className="w-100">
          {(Object.keys(defaultPrompts.tools) as ToolKeys[]).map((key) => (
            <ViewPromptItem
              key={key}
              promptKey={key}
              prompts={defaultPrompts}
              onEdit={setEditPromptKey}
            />
          ))}
        </ListGroup>

        <h4 className="my-2">Schemas</h4>
        <ListGroup className="w-100">
          {Object.keys(defaultPrompts.schemas).map((key) => (
            <ViewPromptItem
              key={key}
              promptKey={key as any}
              prompts={defaultPrompts}
              onEdit={setEditPromptKey}
            />
          ))}
        </ListGroup>
      </Card.Body>

      <EditAiPilotPrompts
        promptKey={editPromptKey}
        onClose={() => setEditPromptKey("")}
        onUpdate={() => reload()}
        defaultPrompts={response?.originalPrompts || defaultPrompts}
        overrides={response?.overrides || []}
        prompts={defaultPrompts}
        vendorList={vendorList}
        modelList={modelList}
      />
    </Card>
  );
}

/**
 * Render a single prompt item
 *
 * @param param0
 * @returns
 */
function ViewPromptItem({
  promptKey,
  prompts,
  onEdit,
}: {
  promptKey: PromptOverrides["key"];
  prompts: AiPilotPrompts;
  onEdit: (key: PromptOverrides["key"]) => void;
}) {
  const { title, subTitle } = getPromptKeyName(promptKey);
  const prompt = prompts.getPrompt(promptKey);

  return (
    <ListGroup.Item className="d-flex align-items-center">
      <div className="flex-grow-1 me-2">
        <h5>
          {title}{" "}
          {subTitle && (
            <span className="text-muted" style={{ fontSize: "0.9em" }}>
              .{subTitle}
            </span>
          )}
        </h5>
        <small>{prompt}</small>
      </div>

      <div>
        <IconButton
          icon="edit"
          variant="outline-secondary"
          size="sm"
          className="text-nowrap"
          onClick={() => onEdit(promptKey)}
        >
          Edit
        </IconButton>
      </div>
    </ListGroup.Item>
  );
}
