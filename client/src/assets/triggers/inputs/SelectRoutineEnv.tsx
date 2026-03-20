import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import Form from "react-bootstrap/Form";

interface SelectRoutineEnvProps {
  environmentId: string | null;
  onChange: (environmentId: string) => void;

  /**
   * The list of environments to choose from.
   */
  environments: RoutineEnvModel[];

  isInvalid?: boolean;
}

/**
 * Input component to select a routine environment for a trigger.
 *
 * @param param0
 * @returns
 */
export function SelectRoutineEnv({
  environmentId,
  onChange,
  environments,
  isInvalid,
}: SelectRoutineEnvProps) {
  return (
    <Form.Select
      className="border-0 bg-light-subtle"
      size="sm"
      isInvalid={isInvalid}
      value={environmentId || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled hidden>
        {"<Not Set>"}
      </option>

      {environments.map((env) => (
        <option key={env.uuid} value={env.uuid}>
          {env.displayName}
        </option>
      ))}
    </Form.Select>
  );
}
