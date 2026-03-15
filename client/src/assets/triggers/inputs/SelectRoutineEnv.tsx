import { RoutineEnvModel } from "common/models/routines/RoutineEnv";

interface SelectRoutineEnvProps {
  environmentId: string | null;
  onChange: (environmentId: string) => void;

  /**
   * The list of environments to choose from.
   */
  environments: RoutineEnvModel[];
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
}: SelectRoutineEnvProps) {
  return (
    <select
      className="form-select form-select-sm border-0 bg-light-subtle"
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
    </select>
  );
}
