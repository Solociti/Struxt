import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import SimpleModal from "client/components/modals/SimpleModal";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { textCapitalize } from "common/format/text";
import {
  EnvironmentTypes,
  VariableState,
  validEnvironments,
} from "common/models/projects/Environment";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";

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

  const [variables, setVariables] = useState<VariableState[]>(
    (envData.variables || []).map((v) => ({
      name: v.name,
      value: v.isSecret ? "" : v.value,
      preview: v.preview,
      isSecret: v.isSecret,
    })),
  );

  const addVariable = (isSecret: boolean) => {
    setVariables([
      ...variables,
      {
        name: "",
        value: "",
        preview: "",
        isSecret,
      },
    ]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, updates: Partial<VariableState>) => {
    setVariables(
      variables.map((v, i) => (i === index ? { ...v, ...updates } : v)),
    );
  };

  const handleSave = useAsyncCallback(async () => {
    // TODO: API logic for variables will go here
    // We will send the updated variables list to the server.
    // Secrets will stay as previews if not changed, or will be encrypted on the server if new.
    // onHide();
  });

  const missingVariables = validEnvironments
    .filter((e) => e !== siteEnv)
    .flatMap((e) => project[e]?.variables || [])
    .filter((v) => !variables.some((existing) => existing.name === v.name))
    .filter(
      (v, index, self) => self.findIndex((t) => t.name === v.name) === index,
    );

  return (
    <SimpleModal
      show={show}
      onHide={onHide}
      size="lg"
      title={`Configure ${textCapitalize(siteEnv)} Environment`}
      footer={
        <>
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
      <div className="mt-2">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="mb-0">Environment Variables</h6>
          <IconButton
            icon="add"
            variant="outline-primary"
            size="sm"
            onClick={() => addVariable(false)}
          >
            Variable
          </IconButton>
        </div>

        <Table responsive size="sm" className="mb-4">
          <thead>
            <tr className="text-muted small uppercase">
              <th style={{ width: "220px" }}>Name</th>
              <th>Value</th>
              <th style={{ width: "40px" }}></th>
            </tr>
          </thead>
          <tbody>
            {variables
              .map((v, i) => ({ ...v, idx: i }))
              .filter((v) => !v.isSecret)
              .map((v) => (
                <tr key={v.idx}>
                  <td className="p-1">
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="VAR_NAME"
                      className="font-monospace border-0 bg-light-subtle"
                      value={v.name}
                      onChange={(e) =>
                        updateVariable(v.idx, { name: e.target.value })
                      }
                    />
                  </td>
                  <td className="p-1">
                    <Form.Control
                      size="sm"
                      className="border-0 bg-light-subtle"
                      type="text"
                      placeholder="Value"
                      value={v.value}
                      onChange={(e) =>
                        updateVariable(v.idx, { value: e.target.value })
                      }
                    />
                  </td>
                  <td className="align-middle p-1">
                    <IconButton
                      icon="delete"
                      variant="link"
                      className="text-danger p-0"
                      onClick={() => removeVariable(v.idx)}
                    />
                  </td>
                </tr>
              ))}
            {!variables.some((v) => !v.isSecret) && (
              <tr>
                <td colSpan={3} className="text-center text-muted py-2 small">
                  No variables defined.
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="mb-0">Secrets</h6>
          <IconButton
            icon="add"
            variant="outline-primary"
            size="sm"
            onClick={() => addVariable(true)}
          >
            Secret
          </IconButton>
        </div>

        <Table responsive size="sm">
          <thead>
            <tr className="text-muted small uppercase">
              <th style={{ width: "220px" }}>Name</th>
              <th>Value</th>
              <th style={{ width: "40px" }}></th>
            </tr>
          </thead>
          <tbody>
            {variables
              .map((v, i) => ({ ...v, idx: i }))
              .filter((v) => v.isSecret)
              .map((v) => (
                <tr key={v.idx}>
                  <td className="p-1">
                    <Form.Control
                      size="sm"
                      type="text"
                      placeholder="SECRET_NAME"
                      className="font-monospace border-0 bg-light-subtle"
                      value={v.name}
                      onChange={(e) =>
                        updateVariable(v.idx, { name: e.target.value })
                      }
                    />
                  </td>
                  <td className="p-1">
                    <Form.Control
                      size="sm"
                      className="border-0 bg-light-subtle"
                      type="password"
                      placeholder={v.preview ? v.preview : "Enter secret"}
                      value={v.value}
                      onChange={(e) =>
                        updateVariable(v.idx, { value: e.target.value })
                      }
                    />
                  </td>
                  <td className="align-middle p-1">
                    <IconButton
                      icon="delete"
                      variant="link"
                      className="text-danger p-0"
                      onClick={() => removeVariable(v.idx)}
                    />
                  </td>
                </tr>
              ))}
            {!variables.some((v) => v.isSecret) && (
              <tr>
                <td colSpan={3} className="text-center text-muted py-2 small">
                  No secrets defined.
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        {missingVariables.length > 0 && (
          <div className="mt-4 pt-3 border-top">
            <h6 className="mb-2 text-muted small uppercase">
              Available from other environments
            </h6>
            <div className="d-flex flex-wrap gap-2">
              {missingVariables.map((v) => (
                <Badge
                  key={v.name}
                  bg="light"
                  text="dark"
                  className="cursor-pointer font-monospace border d-flex align-items-center"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setVariables([
                      ...variables,
                      {
                        name: v.name,
                        value: "",
                        preview: "",
                        isSecret: v.isSecret,
                      },
                    ])
                  }
                  title={`Add ${
                    v.isSecret ? "Secret" : "Variable"
                  } from other environment`}
                >
                  <MaterialIcon className="me-1 fs-6">add</MaterialIcon>
                  {v.name}
                  {v.isSecret && (
                    <MaterialIcon
                      className="ms-1 text-muted fs-6"
                      title="Is Secret"
                    >
                      lock
                    </MaterialIcon>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </SimpleModal>
  );
}
