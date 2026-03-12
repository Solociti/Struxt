import { useLoadAsync } from "client/api/useLoadAsync";
import { useContentManager } from "client/assets/cm/contentManager";
import MaterialIcon from "client/components/MaterialIcon";
import { ShowError } from "client/components/ShowError";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { getRoutineEnvList } from "client/dashboard/admin/routines/routineEnvApi";
import { updateProjectRoutinesEnv } from "client/projects/routineEnv";
import { ProjectFeatureFlags } from "common/models/projects/ProjectModel";
import { RoutineEnvModel } from "common/models/routines/RoutineEnv";
import { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import { EditRoutineEnvModal } from "./RoutineEnvModal";
import IconButton from "client/components/IconButton";

/**
 * Renders the routine environments configured for the current project.
 */
export function RoutineEnvSection() {
  const { projectDetails } = useContentManager();

  const {
    response: allEnvs,
    isLoading: envsLoading,
    error: envsError,
  } = useLoadAsync(() => getRoutineEnvList(), []);

  const routines = projectDetails.data?.featureFlags.routines;
  const isLoading = projectDetails.loading || envsLoading;
  const error = projectDetails.error || envsError;

  return (
    <div>
      <ShowError error={error} />

      {isLoading && (
        <div className="px-3 py-2">
          <Spinner animation="border" size="sm" />
        </div>
      )}

      {!isLoading && routines && !routines.enabled && (
        <p className="text-muted small px-3 py-2 mb-0">
          Upgrade your plan to enable routine environments.
        </p>
      )}

      {!isLoading && routines && routines.enabled && allEnvs && (
        <ShowRoutineInfo allEnvs={allEnvs} />
      )}
    </div>
  );
}

/**
 * Display the env info
 *
 * @param param0
 * @returns
 */
function ShowRoutineInfo({ allEnvs }: { allEnvs: RoutineEnvModel[] }) {
  const { projectDetails, commands } = useContentManager();
  const routines = projectDetails.data?.featureFlags.routines;

  const [editingEnv, setEditingEnv] = useState<{
    env: RoutineEnvModel;
    settings: ProjectFeatureFlags["routines"]["environments"][number];
  } | null>(null);

  const configuredEnvs =
    allEnvs && routines
      ? allEnvs
          .map((env) => ({
            env,
            settings: routines.environments.find((e) => e.uuid === env.uuid)!,
          }))
          .filter((e) => !!e.settings)
      : [];

  const handleAddEnv = useAsyncCallback(async (env: RoutineEnvModel) => {
    const { details } = await updateProjectRoutinesEnv(
      projectDetails.data!.projectId,
      {
        uuid: env.uuid,
        files: env.files,
        ignore: env.ignore,
      },
    );

    commands.trigger("update:project-details", details);
  });

  return (
    <>
      {configuredEnvs.length > 0 && (
        <ListGroup variant="flush">
          {configuredEnvs.map(({ env, settings }) => (
            <ListGroup.Item
              key={env.uuid}
              className="d-flex align-items-center gap-2"
              action
              onClick={() => setEditingEnv({ env, settings })}
            >
              <MaterialIcon style={{ fontSize: "1rem" }}>terminal</MaterialIcon>

              <span className="small text-truncate">
                {env.displayName || env.name}
              </span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {editingEnv && projectDetails.data && (
        <EditRoutineEnvModal
          show={!!editingEnv}
          onHide={() => setEditingEnv(null)}
          env={editingEnv.env}
          project={projectDetails.data}
          envSettings={editingEnv.settings}
          onSave={(details) =>
            commands.trigger("update:project-details", details)
          }
        />
      )}

      {configuredEnvs.length === 0 && (
        <p className="text-muted small px-3 py-2 mb-0">
          No environments configured.
        </p>
      )}

      <div className="text-center py-2">
        <IconButton
          icon="settings"
          variant="outline-secondary"
          size="sm"
          disabled={!projectDetails.data}
          onClick={() => commands.trigger("tabs:open", "settings:triggers")}
        >
          Triggers
        </IconButton>
      </div>

      <div className="text-center py-2">
        <Dropdown>
          <Dropdown.Toggle
            variant="outline-secondary"
            size="sm"
            disabled={!projectDetails.data || handleAddEnv.isLoading}
          >
            <MaterialIcon>add</MaterialIcon>
            Environment
          </Dropdown.Toggle>

          <Dropdown.Menu
            renderOnMount
            popperConfig={{
              strategy: "fixed",
            }}
          >
            {allEnvs.map((env) => (
              <Dropdown.Item
                key={env.uuid}
                disabled={routines?.environments.some(
                  (e) => e.uuid === env.uuid,
                )}
                onClick={() => {
                  handleAddEnv.callback(env);
                }}
              >
                {env.displayName}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </>
  );
}
