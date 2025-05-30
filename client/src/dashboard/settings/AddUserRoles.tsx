import { useLoadAsync } from "client/api/useLoadAsync";
import { getCurrentUser } from "client/auth/user";
import { ShowError } from "client/components/ShowError";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import {
  cancelUserInvite,
  getProjectInvitesList,
  getProjectRoleDocs,
  updateProjectRoles,
} from "client/projects/projectRoles";
import { formatDate } from "common/format/date";
import { ProjectRoleVisualDocument } from "common/models/projects/ProjectRoles";
import { ProjectRoleTypes, roles } from "common/models/user/Roles";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import {
  ProjectRolesInviteModal,
  ProjectRolesModal,
} from "./ProjectRolesModal";

interface AddUserRolesProps {
  projectId: string;
}

/**
 * Add user roles to a project
 *
 * @param param0
 * @returns
 */
export function AddUserRoles({ projectId }: AddUserRolesProps) {
  const currentUser = getCurrentUser();
  const hasEditPermission =
    currentUser.hasPermission(roles.struxt.admin) ||
    currentUser.hasProjectPermission(projectId, [roles.projects.admin]);

  const [reload, setReload] = useState(0);

  const { error, isLoading, response } = useLoadAsync(async () => {
    return await getProjectRoleDocs(projectId);
  }, [projectId, reload]);
  const list = response || [];

  const [showModal, setShowModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roleDoc, setRoleDoc] = useState<null | ProjectRoleVisualDocument>(
    null
  );

  /**
   * Update the roles for a user
   *
   * @param userId
   * @param roles
   */
  const saveRoles = async (userId: string, roles: ProjectRoleTypes[]) => {
    const doc = await updateProjectRoles(projectId, userId, roles);

    if (doc) {
      setReload(reload + 1);
      setShowModal(false);
    }
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <p className="my-0">Manage users and their access to the project.</p>

        {hasEditPermission && (
          <Button
            variant="primary"
            className="text-nowrap"
            onClick={() => {
              setShowInviteModal(true);
            }}
          >
            Invite User
          </Button>
        )}
      </div>

      <ProjectRolesModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
        }}
        onExit={() => {
          setRoleDoc(null);
        }}
        onUpdate={saveRoles}
        roleDoc={roleDoc}
      />

      <ProjectRolesInviteModal
        projectId={projectId}
        show={showInviteModal}
        onHide={() => {
          setShowInviteModal(false);
          setReload((r) => r + 1);
        }}
      />

      {/* show the list of users */}
      <Table striped bordered hover>
        <thead>
          <tr>
            {hasEditPermission && <th></th>}
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>

        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={4} className="text-center">
                <Spinner animation="border" variant="secondary" />
              </td>
            </tr>
          )}

          {error && (
            <tr>
              <td colSpan={4} className="text-danger text-center">
                {error.message}
              </td>
            </tr>
          )}

          {list.map((doc) => (
            <tr key={doc.userId}>
              {hasEditPermission && (
                <td style={{ width: "3em" }} className="py-0 align-middle">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setRoleDoc(doc);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </Button>
                </td>
              )}

              <td>{doc.userDisplayName}</td>
              <td>{doc.userEmail}</td>
              <td>
                {doc.roles.includes(roles.projects.admin)
                  ? "Admin"
                  : doc.roles.includes(roles.projects.edit)
                  ? "Editor"
                  : "Other"}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Add a table for pending invites */}
      <PendingInvites
        projectId={projectId}
        reload={reload}
        onReload={() => setReload((r) => r + 1)}
      />
    </>
  );
}

/**
 * Add the list of pending invites for the project
 *
 * @param param0
 * @returns
 */
function PendingInvites({
  projectId,
  reload,
  onReload,
}: {
  projectId: string;
  reload: number;
  onReload: () => void;
}) {
  // load the list of pending invites for the project
  const { error, response } = useLoadAsync(async () => {
    return await getProjectInvitesList(projectId);
  }, [projectId, reload]);
  const list = response || [];

  // setup the callback to cancel an invite
  const cancelInviteCallback = useAsyncCallback(
    async (inviteId: string) => {
      await cancelUserInvite(projectId, inviteId);

      onReload();
    },
    {
      toastError: true,
    }
  );

  if (list.length === 0 && !error) {
    return null;
  }

  return (
    <>
      <hr />

      <h4>Pending Invites ({list.length})</h4>
      <ShowError error={error} />

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Email</th>
            <th>Expires</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {list.map((invite) => (
            <tr key={invite.inviteId}>
              <td>{invite.email}</td>
              <td>{formatDate(invite.expirationDate, true)}</td>
              <td style={{ width: "10px" }} className="text-nowrap py-1">
                <Button
                  className="mx-1"
                  variant="secondary"
                  size="sm"
                  disabled={cancelInviteCallback.isLoading}
                  onClick={() => cancelInviteCallback.callback(invite.inviteId)}
                >
                  Cancel Invite
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
