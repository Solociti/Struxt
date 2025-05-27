import MaterialIcon from "client/components/MaterialIcon";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { acceptProjectInvite, declineProjectInvite } from "./notifications";

interface ProjectInviteCardProps {
  invite: ProjectRolesInviteModel;

  update: () => void;
}

/**
 *
 * @param param0
 * @returns
 */
export default function ProjectInviteCard({
  invite,
  update,
}: ProjectInviteCardProps) {
  const handleDecline = useAsyncCallback(async () => {
    await declineProjectInvite(invite.inviteId);

    update();
  });

  const handleAccept = useAsyncCallback(async () => {
    await acceptProjectInvite(invite.inviteId);

    update();
  });

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
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDecline.callback}
          disabled={handleDecline.isLoading}
        >
          <MaterialIcon>close</MaterialIcon>
          Decline
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleAccept.callback}
          disabled={handleAccept.isLoading}
        >
          <MaterialIcon>check</MaterialIcon>
          Accept
        </Button>
      </Card.Footer>
    </Card>
  );
}
