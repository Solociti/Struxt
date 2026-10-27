import { useLoadAsync } from "client/api/useLoadAsync";
import IconButton from "client/components/IconButton";
import { ShowError } from "client/components/ShowError";
import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Spinner from "react-bootstrap/Spinner";
import { getRoutineEnvList } from "./routineEnvApi";
import { RoutineEnvEditModal } from "./RoutineEnvEditModal";

/**
 * Show the full list of routine environments
 */
export function RoutineEnv() {
  const { error, isLoading, response, reload } = useLoadAsync(async () => {
    return await getRoutineEnvList();
  }, []);

  const list = response || [];

  const [editEnv, setEditEnv] = useState<RoutineEnvModel | null>(null);

  return (
    <Card className="my-4">
      <Card.Header
        as="div"
        className="d-flex align-items-center justify-content-between"
      >
        <h4 className="my-0">Routine Environments</h4>
        <IconButton
          icon="add"
          variant="success"
          size="sm"
          onClick={() => setEditEnv(new RoutineEnvModel())}
        >
          New Environment
        </IconButton>
      </Card.Header>
      <Card.Body className="d-flex gap-2 justify-content-around flex-wrap">
        <div className="text-muted">
          <p className="mb-2">
            Fission environments are pre-created on the K3s cluster by an admin.
            Struxt only references them by name, it does not manage their
            lifecycle.
          </p>
        </div>

        {isLoading && <Spinner animation="border" size="sm" />}
        <ShowError error={error} />

        {list.map((env) => (
          <Card key={env.uuid} style={{ minWidth: "18rem" }}>
            <Card.Header
              as="div"
              className="d-flex justify-content-between align-items-center gap-2"
            >
              <h5 className="my-0">{env.displayName || env.name}</h5>
              <span className="text-muted small">{env.name}</span>
            </Card.Header>

            <Card.Body>
              <div className="d-flex gap-2 align-items-center justify-content-around">
                <Badge bg="secondary">{env.runtime}</Badge>
                {env.isDefault && <Badge bg="primary">Default</Badge>}
              </div>
            </Card.Body>

            <Card.Footer className="text-end">
              <IconButton
                icon="edit"
                variant="outline-primary"
                size="sm"
                onClick={() => setEditEnv(env)}
              >
                Edit
              </IconButton>
            </Card.Footer>
          </Card>
        ))}

        <RoutineEnvEditModal
          show={Boolean(editEnv)}
          onHide={() => setEditEnv(null)}
          env={editEnv}
          afterSave={() => reload()}
        />
      </Card.Body>
    </Card>
  );
}
