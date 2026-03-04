import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import SimpleModal from "client/components/modals/SimpleModal";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import {
  EnvTable,
  SecretTableRows,
  VariableTableRows,
} from "client/projects/envVariables/EnvTable";
import { updateProjectEnvVariables } from "client/projects/envVariables/envVariables";
import { textCapitalize } from "common/format/text";
import {
  EnvironmentTypes,
  VariableState,
} from "common/models/projects/Environment";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { useEffect, useState } from "react";
import Badge from "react-bootstrap/Badge";
import {
  createChangeList,
  getMissingEnvVariables,
  hasInvalidEntries,
  nextClientUuid,
} from "./envUtils";
import { ShowError } from "client/components/ShowError";

/**
 * Modal for editing environment variables and secrets for a specific environment of a project.
 *
 * @param param0
 * @returns
 */
export function SiteEnvModal({
  show,
  onHide,
  siteEnv,
  project,
  onSave,
}: {
  show: boolean;
  onHide: () => void;
  siteEnv: EnvironmentTypes;
  project: ProjectDetails;
  onSave: (project: ProjectDetails) => void;
}) {
  const envData = project[siteEnv];

  const [variables, setVariables] = useState<VariableState[]>([]);

  useEffect(() => {
    if (show) {
      setVariables(envData.variables || []);
    }
  }, [show]);

  const changeList = createChangeList(siteEnv, envData.variables, variables);

  const addVariable = (isSecret: boolean) => {
    setVariables([
      ...variables,
      {
        uuid: nextClientUuid(),
        name: "",
        value: "",
        secretLength: 0,
        isSecret,
      },
    ]);
  };

  const removeVariable = (uuid: string) => {
    setVariables(variables.filter((v) => v.uuid !== uuid));
  };

  const updateVariable = (uuid: string, updates: Partial<VariableState>) => {
    setVariables(
      variables.map((v) => (v.uuid === uuid ? { ...v, ...updates } : v)),
    );
  };

  const handleSave = useAsyncCallback(async () => {
    const result = await updateProjectEnvVariables(
      project.projectId,
      changeList,
    );
    onSave(result.details);
    onHide();
  });

  const missingVariables = getMissingEnvVariables(siteEnv, project, variables);

  const updateCount = changeList.filter((c) => "update" in c).length;
  const removeCount = changeList.filter((c) => "remove" in c).length;

  const nonSecretVars = variables.filter((v) => !v.isSecret);
  const secretVars = variables.filter((v) => v.isSecret);

  return (
    <SimpleModal
      show={show}
      onHide={onHide}
      size="lg"
      onExit={() => {
        setVariables([]);
      }}
      title={`Configure ${textCapitalize(siteEnv)} Environment`}
      footer={
        <>
          <ChangeSummary updateCount={updateCount} removeCount={removeCount} />
          <IconButton icon="close" variant="secondary" onClick={onHide}>
            Cancel
          </IconButton>
          <IconButton
            icon="save"
            variant="primary"
            onClick={handleSave.callback}
            disabled={
              handleSave.isLoading ||
              changeList.length === 0 ||
              hasInvalidEntries(variables)
            }
          >
            Save
          </IconButton>
        </>
      }
    >
      <div className="mt-2">
        <ShowError error={handleSave.error} />

        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="mb-0">Environment Variables</h5>
          <IconButton
            icon="add"
            variant="outline-primary"
            size="sm"
            onClick={() => addVariable(false)}
          >
            Variable
          </IconButton>
        </div>

        <EnvTable className="mb-4">
          <VariableTableRows
            variables={nonSecretVars}
            allVariables={variables}
            onUpdate={updateVariable}
            onRemove={removeVariable}
          />
        </EnvTable>

        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="mb-0">Secrets</h5>
          <IconButton
            icon="add"
            variant="outline-primary"
            size="sm"
            onClick={() => addVariable(true)}
          >
            Secret
          </IconButton>
        </div>

        <EnvTable>
          <SecretTableRows
            variables={secretVars}
            allVariables={variables}
            onUpdate={updateVariable}
            onRemove={removeVariable}
          />
        </EnvTable>

        {missingVariables.length > 0 && (
          <MissingVariablesList
            variables={missingVariables}
            onAdd={(variable) =>
              setVariables([
                ...variables,
                {
                  uuid: nextClientUuid(),
                  name: variable.name,
                  value: "",
                  secretLength: 0,
                  isSecret: variable.isSecret,
                },
              ])
            }
          />
        )}
      </div>
    </SimpleModal>
  );
}

/**
 * Show the missing var badge
 *
 * @param param0
 * @returns
 */
function AddMissingVariable({
  variable,
  onAdd,
}: {
  variable: VariableState;
  onAdd: (variable: VariableState) => void;
}) {
  return (
    <Badge
      bg="secondary"
      className="p-1 cursor-pointer"
      onClick={() => onAdd(variable)}
      title={`Add ${variable.isSecret ? "Secret" : "Variable"}.`}
    >
      <MaterialIcon style={{ fontSize: "1.5em" }}>add</MaterialIcon>
      <span className="font-monospace">{variable.name}</span>
      {variable.isSecret && (
        <MaterialIcon title="Is Secret" style={{ fontSize: "1.5em" }}>
          lock
        </MaterialIcon>
      )}
    </Badge>
  );
}

/**
 * Add the list of missing variables from other environments
 *
 * @param param0
 * @returns
 */
function MissingVariablesList({
  variables,
  onAdd,
}: {
  variables: VariableState[];
  onAdd: (variable: VariableState) => void;
}) {
  if (variables.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-3 border-top">
      <h6 className="mb-2 text-muted small uppercase">
        Available from other environments
      </h6>

      <div className="d-flex flex-wrap gap-2">
        {variables.map((v) => (
          <AddMissingVariable key={v.name} variable={v} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}

function ChangeSummary({
  updateCount,
  removeCount,
}: {
  updateCount: number;
  removeCount: number;
}) {
  if (updateCount === 0 && removeCount === 0) {
    return <span className="text-muted small me-auto">No changes</span>;
  }

  return (
    <span className="d-flex align-items-center gap-2 me-auto small">
      {updateCount > 0 && (
        <Badge bg="info" text="dark">
          {updateCount} {updateCount === 1 ? "Change" : "Changes"}
        </Badge>
      )}
      {removeCount > 0 && (
        <Badge bg="warning" text="dark">
          {removeCount} {removeCount === 1 ? "Removed" : "Removed"}
        </Badge>
      )}
    </span>
  );
}
