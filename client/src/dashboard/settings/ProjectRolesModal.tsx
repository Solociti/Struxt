import Group from "client/components/Group";
import { ShowError } from "client/components/ShowError";
import SimpleModal from "client/components/SimpleModal";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { ProjectRoleVisualDocument } from "common/models/projects/ProjectRoles";
import {
  ProjectRoleDescriptions,
  ProjectRoleGroups,
  ProjectRoleList,
  ProjectRoleTypes,
} from "common/models/user/Roles";
import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
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

  const saveCallback = useAsyncCallback(async () => {
    if (roleDoc) {
      await onUpdate(roleDoc.userId, currentRoles);
    }
  });

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
            onClick={saveCallback.callback}
            disabled={saveCallback.isLoading}
          >
            Save
          </Button>
        </>
      }
    >
      {roleDoc && (
        <>
          <ShowError error={saveCallback.error} />

          <Group prepend="Preset">
            <Dropdown
              onSelect={(group: any) => {
                if (!group) {
                  return;
                }

                const roles = ProjectRoleGroups[group as "Admin"] || [];
                setCurrentRoles(roles);
              }}
            >
              <Dropdown.Toggle variant="secondary">Select</Dropdown.Toggle>

              <Dropdown.Menu>
                {Object.keys(ProjectRoleGroups).map((group) => {
                  return (
                    <Dropdown.Item eventKey={group} key={group}>
                      {group}
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Group>

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
