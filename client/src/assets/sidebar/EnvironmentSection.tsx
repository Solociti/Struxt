import MaterialIcon from "client/components/MaterialIcon";
import {
  EnvironmentTypes,
  validEnvironments,
} from "common/models/projects/Environment";
import ListGroup from "react-bootstrap/ListGroup";

const envIcons: Record<EnvironmentTypes, string> = {
  staging: "science",
  production: "rocket_launch",
};

/**
 * Renders the list of project deploy environments (staging and production).
 */
export function EnvironmentSection() {
  return (
    <ListGroup variant="flush">
      {validEnvironments.map((env) => (
        <ListGroup.Item
          key={env}
          className="d-flex align-items-center gap-2 py-2 px-3"
          style={{ cursor: "default" }}
        >
          <MaterialIcon style={{ fontSize: "1rem" }}>
            {envIcons[env]}
          </MaterialIcon>
          <span className="small text-capitalize">{env}</span>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
