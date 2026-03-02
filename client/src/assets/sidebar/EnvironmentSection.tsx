import { useContentManager } from "client/assets/cm/contentManager";
import MaterialIcon from "client/components/MaterialIcon";
import {
  EnvironmentTypes,
  validEnvironments,
} from "common/models/projects/Environment";
import { useState } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { SiteEnvModal } from "./SiteEnvModal";

const envIcons: Record<EnvironmentTypes, string> = {
  staging: "science",
  production: "rocket_launch",
};

/**
 * Renders the list of project deploy environments (staging and production).
 */
export function EnvironmentSection() {
  const { projectDetails, commands } = useContentManager();
  const [editingEnv, setEditingEnv] = useState<EnvironmentTypes | null>(null);

  if (!projectDetails.data) {
    return null;
  }

  return (
    <>
      <ListGroup variant="flush">
        {validEnvironments.map((env) => (
          <ListGroup.Item
            key={env}
            className="d-flex align-items-center gap-2 py-2 px-3"
            action
            onClick={() => setEditingEnv(env)}
          >
            <MaterialIcon style={{ fontSize: "1rem" }}>
              {envIcons[env]}
            </MaterialIcon>

            <span className="small text-capitalize">{env}</span>
          </ListGroup.Item>
        ))}
      </ListGroup>

      {editingEnv && projectDetails.data && (
        <SiteEnvModal
          show={!!editingEnv}
          onHide={() => setEditingEnv(null)}
          siteEnv={editingEnv}
          project={projectDetails.data}
          onSave={(details) =>
            commands.trigger("update:project-details", details)
          }
        />
      )}
    </>
  );
}
