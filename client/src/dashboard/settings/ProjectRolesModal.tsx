import Group from "client/components/Group";
import { ShowError } from "client/components/ShowError";
import SimpleModal from "client/components/SimpleModal";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { inviteUser } from "client/projects/projectRoles";
import { ProjectRoleVisualDocument } from "common/models/projects/ProjectRoles";
import {
  ProjectRoleDescriptions,
  ProjectRoleGroups,
  ProjectRoleList,
  ProjectRoleTypes,
} from "common/models/user/Roles";
import { useEffect, useRef, useState } from "react";
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

          <AddRolesTable
            currentRoles={currentRoles}
            setCurrentRoles={setCurrentRoles}
          />
        </>
      )}
    </SimpleModal>
  );
}

interface ProjectRolesInviteModalProps {
  show: boolean;
  onHide: () => void;

  projectId: string;
}

/**
 * Invite a new user to the project
 *
 * @param param0
 * @returns
 */
export function ProjectRolesInviteModal({
  show,
  onHide,
  projectId,
}: ProjectRolesInviteModalProps) {
  const [currentRoles, setCurrentRoles] = useState<ProjectRoleTypes[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setCurrentRoles([]);
    setError(null);
  }, [show]);

  const handleSubmit = () => {
    if (form.current) {
      const formData = new FormData(form.current);
      const email = formData.get("email") as string;
      const message = formData.get("message") as string;

      if (!email) {
        setError(new Error("Email is required"));
        return;
      }

      if (currentRoles.length === 0) {
        setError(new Error("At least one role is required"));
        return;
      }

      inviteUser(projectId, email, currentRoles, message)
        .then(() => {
          onHide();
        })
        .catch((error) => {
          setError(error);
        });
    }
  };

  return (
    <SimpleModal
      show={show}
      onHide={onHide}
      size="lg"
      title="Invite User"
      footer={
        <>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Send
          </Button>
        </>
      }
    >
      <p>Invite a user to the project</p>

      <ShowError error={error} />

      <form ref={form}>
        <div className="d-flex flex-column gap-2">
          <Group prepend="Email">
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="email@example.com"
              required
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </Group>

          <Group prepend="Message">
            <textarea
              name="message"
              className="form-control"
              placeholder="Enter a message"
              rows={3}
            ></textarea>
          </Group>
        </div>
      </form>
      <hr />

      <AddRolesTable
        currentRoles={currentRoles}
        setCurrentRoles={setCurrentRoles}
      />
    </SimpleModal>
  );
}

interface AddRolesTableProps {
  currentRoles: ProjectRoleTypes[];
  setCurrentRoles: (roles: ProjectRoleTypes[]) => void;
}

function AddRolesTable({ currentRoles, setCurrentRoles }: AddRolesTableProps) {
  const toggleRole = (role: ProjectRoleTypes) => {
    const roles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];

    setCurrentRoles(roles);
  };

  return (
    <>
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
  );
}
