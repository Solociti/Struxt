import { useLoadAsync } from "client/api/useLoadAsync";
import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { useCurrentProject } from "client/projects/ProjectContext";
import { formatDate } from "common/format/date";
import { EditorSnapshotListItem } from "common/models/projects/EditorSnapshot";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Popover from "react-bootstrap/Popover";
import { editEditorSnapshot } from "./editEditorSnapshot";
import { getEditorSnapshots } from "./getEditorSnapshots";
import { restoreEditorSnapshot } from "./restoreEditorSnapshot";

function getSnapshotTitle(snapshot: EditorSnapshotListItem) {
  switch (snapshot.eventType) {
    case "staging":
      return "Published Staging";
    case "production":
      return "Published Production";
    case "save":
      return "Project Saved";
  }

  return snapshot.eventType;
}

export default function SettingsContent() {
  const { project } = useCurrentProject();

  // load the list of snapshots
  const {
    response: snapshotList,
    isLoading: loadingList,
    reload: refreshList,
    // error: projectDetailsError,
  } = useLoadAsync(async () => {
    if (project.projectId === "*") {
      return null;
    }

    // Load project details
    return await getEditorSnapshots(project.projectId);
  }, [project.projectId]);

  const restoreCallback = useAsyncCallback(
    async (item: EditorSnapshotListItem) => {
      const result = await restoreEditorSnapshot(
        item.projectId,
        item.snapshotTime,
        item.eventType
      );
      if (result.success) {
        refreshList();
      }
    }
  );

  const lockCallback = useAsyncCallback(
    async (item: EditorSnapshotListItem) => {
      const result = await editEditorSnapshot(
        item.projectId,
        item.snapshotTime,
        item.eventType,
        {
          key: "locked.active",
          value: !item.locked.active,
        }
      );
      if (result.success) {
        refreshList();
      }
    }
  );

  if (project.projectId === "*") {
    return (
      <Container className="py-4">
        <h1 className="fw-bold mb-3">Snapshots</h1>
        <p>Please select a project to continue...</p>
      </Container>
    );
  }

  if (loadingList && !snapshotList) {
    return (
      <Container className="py-4">
        <h1 className="fw-bold mb-3">Snapshots</h1>
        <p>Loading...</p>
      </Container>
    );
  }

  if (snapshotList) {
    return (
      <Container>
        <div className="mb-4 d-flex align-items-center justify-content-between">
          <h1 className="fw-bold mb-0">Snapshots</h1>
          <IconButton
            variant="secondary"
            icon="refresh"
            onClick={refreshList}
            spinner={loadingList}
          >
            Refresh
          </IconButton>
        </div>

        <div className="d-flex flex-wrap">
          {snapshotList.map((snapshot, index) => (
            <Card
              key={index}
              className="m-3 flex-grow-1"
              style={{ minWidth: "300px" }}
            >
              <Card.Header
                as="div"
                className="d-flex align-items-center justify-content-between gap-2"
              >
                <h5 className="mb-0">{getSnapshotTitle(snapshot)}</h5>
                {snapshot.locked.active && <MaterialIcon>lock</MaterialIcon>}
              </Card.Header>
              <Card.Body>
                <div className="mb-2">
                  Created by {snapshot.created.displayName}
                </div>
                <div className="mb-2">
                  {formatDate(snapshot.created.date, true)}
                </div>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between">
                <IconButton
                  variant="outline-primary"
                  icon="restore"
                  disabled={restoreCallback.isLoading}
                  onClick={() => restoreCallback.callback(snapshot)}
                >
                  Restore
                </IconButton>
                <IconButton
                  variant="outline-secondary"
                  icon={snapshot.locked.active ? "lock_open" : "lock"}
                  tooltip={
                    <Popover>
                      <Popover.Body>
                        Prevents this snapshot from being deleted when locked.
                      </Popover.Body>
                    </Popover>
                  }
                  disabled={lockCallback.isLoading}
                  onClick={() => lockCallback.callback(snapshot)}
                >
                  {snapshot.locked.active ? "Unlock" : "Lock"}
                </IconButton>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="fw-bold mb-3">Snapshots</h1>
      <p>Project details not found.</p>
    </Container>
  );
}
