import { useLoadAsync } from "client/api/useLoadAsync";
import { getCurrentUser } from "client/auth/user";
import {
  getProjectRoleDocs,
  updateProjectRoles,
} from "client/projects/projectRoles";
import { ProjectRoleVisualDocument } from "common/models/projects/ProjectRoles";
import { ProjectRoleTypes, roles } from "common/models/user/Roles";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { ProjectRolesModal } from "./ProjectRolesModal";

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
          <Button variant="primary" className="text-nowrap" onClick={() => {}}>
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
    </>
  );
}
