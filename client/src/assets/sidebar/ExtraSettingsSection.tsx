import MaterialIcon from "client/components/MaterialIcon";
import ListGroup from "react-bootstrap/ListGroup";
import { useContentManager } from "../cm/contentManager";

/**
 * The list of extra settings to render in the sidebar.
 *
 */
export function ExtraSettingsSection() {
  const { projectDetails, commands } = useContentManager();
  const routines = projectDetails.data?.featureFlags.routines;

  const items = [
    routines?.enabled && (
      <ListGroup.Item
        key="triggers"
        className="d-flex align-items-center gap-2 py-2 px-3"
        action
        onClick={() => commands.trigger("tabs:open", "settings:triggers")}
      >
        <MaterialIcon style={{ fontSize: "1rem" }}>alt_route</MaterialIcon>

        <span className="small">Triggers</span>
      </ListGroup.Item>
    ),
  ].filter(Boolean);

  return (
    <ListGroup variant="flush">
      {items.length > 0 ? (
        items
      ) : (
        <p className="text-muted small px-3 py-2 mb-0">
          No extra settings available.
        </p>
      )}
    </ListGroup>
  );
}
