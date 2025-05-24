import MaterialIcon from "client/components/MaterialIcon";
import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";

interface ProjectInviteCardProps {
  invite: ProjectRolesInviteModel;
}

/**
 *
 * @param param0
 * @returns
 */
export default function ProjectInviteCard({ invite }: ProjectInviteCardProps) {
  return (
    <Card>
      <Card.Header as="h4">Invite</Card.Header>

      <Card.Body>
        <p>
          <strong>{invite.created.displayName}</strong> is inviting you to join
          the project <strong>{invite.projectName}</strong>.
        </p>
        {invite.message && (
          <p>
            Message: <em>{invite.message}</em>
          </p>
        )}
      </Card.Body>

      <Card.Footer className="d-flex justify-content-end gap-2">
        <Button variant="secondary" size="sm">
          <MaterialIcon>close</MaterialIcon>
          Decline
        </Button>

        <Button variant="primary" size="sm">
          <MaterialIcon>check</MaterialIcon>
          Accept
        </Button>
      </Card.Footer>
    </Card>
  );
}
