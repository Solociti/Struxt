import { useLoadAsync } from "client/api/useLoadAsync";
import MaterialIcon from "client/components/MaterialIcon";
import { ShowError } from "client/components/ShowError";
import { getRoutineEnvList } from "client/dashboard/admin/routines/routineEnvApi";
import Spinner from "react-bootstrap/Spinner";
import ListGroup from "react-bootstrap/ListGroup";

/**
 * Renders the list of available routine runtime environments.
 */
export function RoutineEnvSection() {
  const {
    response: envs,
    isLoading,
    error,
  } = useLoadAsync(() => getRoutineEnvList(), []);

  return (
    <div>
      <ShowError error={error} />

      {isLoading && (
        <div className="px-3 py-2">
          <Spinner animation="border" size="sm" />
        </div>
      )}

      {envs && envs.length > 0 && (
        <ListGroup variant="flush">
          {envs.map((env) => (
            <ListGroup.Item
              key={env.uuid}
              className="d-flex align-items-center gap-2 py-2 px-3"
              style={{ cursor: "default" }}
            >
              <MaterialIcon style={{ fontSize: "1rem" }}>terminal</MaterialIcon>
              <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                <span className="small text-truncate">
                  {env.displayName || env.name}
                </span>
                <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                  {env.runtime}
                </span>
              </div>
              {env.isDefault && (
                <span
                  className="ms-auto badge bg-secondary"
                  style={{ fontSize: "0.65rem" }}
                >
                  default
                </span>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {envs && envs.length === 0 && (
        <p className="text-muted small px-3 py-2 mb-0">
          No environments configured.
        </p>
      )}
    </div>
  );
}
