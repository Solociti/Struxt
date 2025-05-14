import { useLoadAsync } from "client/api/useLoadAsync";
import { getProjectRoleDocs } from "client/projects/projectRoles";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";

/**
 * Add user roles to a project
 *
 * @param param0
 * @returns
 */
export function AddUserRoles({ projectId }: { projectId: string }) {
  const { error, isLoading, response } = useLoadAsync(async () => {
    return await getProjectRoleDocs(projectId);
  }, [projectId]);

  const list = response || [];

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <p className="my-0">Manage users and their access to the project.</p>

        <Button variant="primary" className="text-nowrap" onClick={() => {}}>
          Invite User
        </Button>
      </div>

      {/* show the list of users */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>

        <tbody>
          {list.map((doc) => (
            <tr key={doc.userId}>
              <td style={{ width: "3em" }} className="py-0 align-middle">
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </td>

              <td>{doc.userDisplayName}</td>
              <td>{doc.userEmail}</td>
              <td>{doc.roles.join(" | ")}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
