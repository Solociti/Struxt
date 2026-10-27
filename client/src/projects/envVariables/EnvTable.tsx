import { FormInput } from "client/components/FormInput";
import IconButton from "client/components/IconButton";
import { VariableState } from "common/models/projects/Environment";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import Table from "react-bootstrap/Table";

interface EnvTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Table wrapper with name/value/delete column headers for environment variables or secrets.
 */
export function EnvTable({ children, className }: EnvTableProps) {
  return (
    <Table responsive size="sm" className={className}>
      <thead>
        <tr className="text-muted small uppercase">
          <th style={{ width: "220px" }}>Name</th>
          <th>Value</th>
          <th style={{ width: "40px" }}></th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </Table>
  );
}

interface VariableTableRowsProps {
  variables: VariableState[];
  allVariables: VariableState[];
  onUpdate: (uuid: string, updates: Partial<VariableState>) => void;
  onRemove: (uuid: string) => void;
}

/**
 * Input component for variable name with validation and error tooltip.
 *
 * @param param0
 */
function NameInput({
  name,
  allVariables,
  currentUuid,
  onChange,
}: {
  name: string;
  allVariables: VariableState[];
  currentUuid: string;
  onChange: (value: string) => void;
}) {
  const isValid =
    !name ||
    !allVariables.some(
      (other) => other.uuid !== currentUuid && other.name === name,
    );

  const input = (
    <FormInput
      size="sm"
      type="text"
      placeholder="VAR_NAME"
      className="font-monospace border-0 bg-light-subtle"
      value={name}
      onRealChange={(value) => onChange(value.trim())}
      isInvalid={!isValid}
      maxLength={128}
    />
  );

  if (isValid) {
    return input;
  }

  return (
    <OverlayTrigger
      overlay={
        <Popover>
          <Popover.Body>Variable name must be unique.</Popover.Body>
        </Popover>
      }
    >
      {input}
    </OverlayTrigger>
  );
}

/**
 * Renders table rows for non-secret environment variables.
 *
 * @param allVariables Full variable list used for duplicate name validation.
 */
export function VariableTableRows({
  variables,
  allVariables,
  onUpdate,
  onRemove,
}: VariableTableRowsProps) {
  if (variables.length === 0) {
    return (
      <tr>
        <td colSpan={3} className="text-center text-muted py-2 small">
          No variables defined.
        </td>
      </tr>
    );
  }

  return variables.map((v) => (
    <tr key={v.uuid}>
      <td className="p-1">
        <NameInput
          name={v.name}
          allVariables={allVariables}
          currentUuid={v.uuid}
          onChange={(name) => onUpdate(v.uuid, { name })}
        />
      </td>
      <td className="p-1">
        <FormInput
          size="sm"
          className="border-0 bg-light-subtle"
          type="text"
          placeholder="Value"
          value={v.value}
          onRealChange={(value) => onUpdate(v.uuid, { value })}
          maxLength={2048}
        />
      </td>
      <td className="align-middle p-1">
        <IconButton
          icon="delete"
          variant="link"
          className="text-danger p-0"
          onClick={() => onRemove(v.uuid)}
        />
      </td>
    </tr>
  ));
}

/**
 * Renders table rows for secret environment variables.
 */
export function SecretTableRows({
  variables,
  allVariables,
  onUpdate,
  onRemove,
}: VariableTableRowsProps) {
  if (variables.length === 0) {
    return (
      <tr>
        <td colSpan={3} className="text-center text-muted py-2 small">
          No secrets defined.
        </td>
      </tr>
    );
  }

  return variables.map((v) => (
    <tr key={v.uuid}>
      <td className="p-1">
        <NameInput
          name={v.name}
          allVariables={allVariables}
          currentUuid={v.uuid}
          onChange={(name) => onUpdate(v.uuid, { name })}
        />
      </td>
      <td className="p-1">
        <FormInput
          size="sm"
          className="border-0 bg-light-subtle"
          type="password"
          placeholder={
            v.secretLength ? `(${v.secretLength} chars)` : "Enter secret"
          }
          value={v.value}
          onRealChange={(value) => onUpdate(v.uuid, { value })}
          maxLength={2048}
        />
      </td>
      <td className="align-middle p-1">
        <IconButton
          icon="delete"
          variant="link"
          className="text-danger p-0"
          onClick={() => onRemove(v.uuid)}
        />
      </td>
    </tr>
  ));
}
