import { useLoadAsync } from "client/api/useLoadAsync";
import MaterialIcon from "client/components/MaterialIcon";
import { ShowError } from "client/components/ShowError";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import Spinner from "react-bootstrap/Spinner";
import { getNotifications } from "./notifications";
import ProjectInviteCard from "./ProjectInviteCard";

export default function NotificationsPopover({}) {
  const [reload, setReload] = useState(0);

  const { response, isLoading, error } = useLoadAsync(async () => {
    // load the notifications from the server
    const response = await getNotifications();

    return response;
  }, [reload]);

  const invites = response?.invites || [];
  const hasNotifications = invites.length > 0;

  const popover = (
    <Popover
      id="notifications-popover"
      style={{ maxWidth: "min(30rem, 90vw)" }}
    >
      <Popover.Header as="h3">Notifications</Popover.Header>
      <Popover.Body>
        {isLoading && <Spinner animation="border" />}

        <ShowError error={error} />

        {!isLoading && !hasNotifications && (
          <span className="text-muted">No new notifications</span>
        )}

        {/* show the list of project invites */}
        <div className="d-flex flex-column gap-2">
          {invites.map((invite) => {
            return (
              <ProjectInviteCard
                key={invite.inviteId}
                invite={invite}
                update={() => setReload((r) => r + 1)}
              />
            );
          })}
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom"
      overlay={popover}
      onEnter={() => setReload((r) => r + 1)}
      popperConfig={{
        strategy: "fixed",
      }}
    >
      <Button
        variant={hasNotifications ? "info" : "outline-info"}
        className="mx-3 px-2"
      >
        <MaterialIcon filled={hasNotifications}>notifications</MaterialIcon>
      </Button>
    </OverlayTrigger>
  );
}
