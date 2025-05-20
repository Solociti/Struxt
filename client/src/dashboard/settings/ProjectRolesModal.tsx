import SimpleModal from "client/components/SimpleModal";
import { ProjectRoleVisualDocument } from "common/models/projects/ProjectRoles";
import {
  ProjectRoleDescriptions,
  ProjectRoleList,
  ProjectRoleTypes,
} from "common/models/user/Roles";
import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";

interface ProjectRolesModalProps {
  show: boolean;
  onHide: () => void;
  onExit: () => void;
  roleDoc: ProjectRoleVisualDocument | null;
  onUpdate: (userId: string, roles: ProjectRoleTypes[]) => Promise<void>;
}

/**
 * Project roles modal
 *
 * @param param0
 * @returns
 */
export function ProjectRolesModal({
  onExit,
  onHide,
  onUpdate,
  roleDoc,
  show,
}: ProjectRolesModalProps) {
  const [currentRoles, setCurrentRoles] = useState<ProjectRoleTypes[]>([]);

  useEffect(() => {
    if (roleDoc) {
      setCurrentRoles(roleDoc.roles);
    } else {
      setCurrentRoles([]);
    }
  }, [roleDoc]);

  const toggleRole = (role: ProjectRoleTypes) => {
    if (!roleDoc) {
      return;
    }

    const roles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];

    setCurrentRoles(roles);
  };

  return (
    <SimpleModal
      show={show}
      onHide={onHide}
      onExit={onExit}
      size="lg"
      title="Project Roles"
      footer={
        <>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              if (roleDoc) {
                await onUpdate(roleDoc.userId, currentRoles);
              }
            }}
          >
            Save
          </Button>
        </>
      }
    >
      {roleDoc && (
        <>
          <Table striped bordered hover className="mt-4">
            <thead>
              <tr>
                <th></th>
                <th>Role</th>
                <th>Description</th>
              </tr>
            </thead>

            <tbody>
              {ProjectRoleList.map((role) => {
                const description = ProjectRoleDescriptions[role] || "";

                const checked = currentRoles.includes(role);

                return (
                  <tr
                    key={role}
                    className="align-middle cursor-pointer"
                    onClick={() => toggleRole(role)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRole(role)}
                      />
                    </td>
                    <td>{role}</td>
                    <td>{description}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </>
      )}
    </SimpleModal>
  );
}
