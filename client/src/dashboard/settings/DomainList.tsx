import MaterialIcon from "client/components/MaterialIcon";
import { useConfirmModal } from "client/components/modals/useConfirmModal";
import {
  EnvironmentTypes,
  ProjectDomain,
} from "common/models/projects/Environment";
import { forwardRef, useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import ListGroup from "react-bootstrap/ListGroup";
import VerifyDomainModal from "./VerifyDomainModal";

/**
 * Show the list of domains
 *
 * @param param0
 * @returns
 */
export function DomainList({
  domains,
  environment,
  projectId,
}: {
  domains: ProjectDomain[];
  environment: EnvironmentTypes;
  projectId: string;
}) {
  return (
    <ListGroup>
      {domains.map((domain, index) => (
        <DomainListItem
          key={index}
          domain={domain}
          environment={environment}
          projectId={projectId}
        />
      ))}
    </ListGroup>
  );
}

function DomainListItem({
  domain,
  environment,
  projectId,
}: {
  domain: ProjectDomain;
  environment: EnvironmentTypes;
  projectId: string;
}) {
  const isEnabled = domain.enabled.active && domain.dnsVerified.active;

  return (
    <ListGroup.Item className="p-1 d-flex align-items-center flex-wrap">
      <div className="d-flex align-items-center">
        <MaterialIcon
          className={`text-${isEnabled ? "success" : "danger"} ms-2`}
          title={isEnabled ? "Domain is enabled" : "Domain is not enabled"}
        >
          {isEnabled ? "check_circle" : "error"}
        </MaterialIcon>

        {domain.isPrimary && (
          <MaterialIcon title="Primary Domain">language</MaterialIcon>
        )}

        <span
          className={`ms-2 ${
            domain.deleted.active ? "text-decoration-line-through" : ""
          }`}
        >
          {domain.domain}
        </span>

        {domain.deleted.active && (
          <Badge bg="danger" className="mx-2">
            Deleted
          </Badge>
        )}
      </div>

      <div className="d-flex align-items-center flex-grow-1 justify-content-end">
        <ListItemDropdown
          domain={domain}
          environment={environment}
          projectId={projectId}
        />
      </div>
    </ListGroup.Item>
  );
}

/**
 * Dropdown for the domain list item
 *
 * @param param0
 * @returns
 */
function ListItemDropdown({
  domain,
  environment,
  projectId,
}: {
  domain: ProjectDomain;
  environment: EnvironmentTypes;
  projectId: string;
}) {
  const customToggle = forwardRef<HTMLButtonElement>((props, ref) => (
    <Button
      ref={ref}
      {...props}
      variant="link"
      size="sm"
      className="text-decoration-none"
    >
      <MaterialIcon>more_vert</MaterialIcon>
    </Button>
  ));

  // setup the delete confirmation modal
  const { confirmModal: deleteModal, showConfirmModal: showDeleteModal } =
    useConfirmModal({
      message: (
        <>
          <p>
            Are you sure you want to delete the domain <b>{domain.domain}</b>?
          </p>

          <p>The domain will be removed after the next publish.</p>
        </>
      ),
      title: "Delete Domain",
      confirmButtonText: "Delete",
      onConfirm: () => {
        // Handle the deletion logic here
        console.log(`Deleting domain: ${domain.domain}`);
      },
    });

  const { confirmModal: disableModal, showConfirmModal: showDisableModal } =
    useConfirmModal({
      message: (
        <>
          <p>
            Are you sure you want to{" "}
            {domain.enabled.active ? "disable" : "enable"} the domain{" "}
            {domain.domain}?
          </p>
          <p>This change will be applied after the next publish.</p>
        </>
      ),
      title: `${domain.enabled.active ? "Disable" : "Enable"} Domain`,
      confirmButtonText: `${
        domain.enabled.active ? "Disable" : "Enable"
      } Domain`,
      onConfirm: () => {
        // Handle the enable/disable logic here
        console.log(
          `${domain.enabled.active ? "Disabling" : "Enabling"} domain: ${
            domain.domain
          }`
        );
      },
    });

  // setup the make primary confirmation modal
  // warn users about changing the primary domain
  // especially because of existing 301's
  const { confirmModal: primaryModal, showConfirmModal: showPrimaryModal } =
    useConfirmModal({
      message: (
        <>
          <p>
            Are you sure you want to set <b>{domain.domain}</b> as the primary
            domain?
          </p>

          <p>
            This will change how users access your site. The primary domain
            becomes your main URL, while other domains will redirect to it.
          </p>

          <p className="text-muted small">
            Technical note: Existing 301 redirects from this domain might still
            be cached for previous users.
          </p>
        </>
      ),
      title: "Make Primary Domain",
      confirmButtonText: "Make Primary",
      onConfirm: () => {
        // Handle the logic to make this domain primary
        console.log(`Making domain ${domain.domain} primary`);
      },
    });

  const [showDnsModal, setShowDnsModal] = useState(false);

  return (
    <Dropdown>
      <Dropdown.Toggle as={customToggle} />

      {deleteModal}
      {disableModal}
      {primaryModal}

      <VerifyDomainModal
        show={showDnsModal}
        onHide={() => setShowDnsModal(false)}
        domain={domain}
        environment={environment}
        projectId={projectId}
      />

      <Dropdown.Menu>
        <Dropdown.Item onClick={() => setShowDnsModal(true)}>
          <MaterialIcon className="me-2">dns</MaterialIcon>
          Verify DNS
        </Dropdown.Item>

        <Dropdown.Item
          onClick={() => showPrimaryModal()}
          disabled={domain.isPrimary || !domain.dnsVerified.active}
        >
          <MaterialIcon className="me-2">language</MaterialIcon>
          Set Primary
        </Dropdown.Item>

        <Dropdown.Item
          onClick={() => showDisableModal()}
          disabled={domain.isPrimary || !domain.dnsVerified.active}
        >
          <MaterialIcon className="me-2">
            {domain.enabled.active ? "toggle_off" : "toggle_on"}
          </MaterialIcon>
          {domain.enabled.active ? "Disable Domain" : "Enable Domain"}
        </Dropdown.Item>

        {/* only show the delete button if the domain is already disabled */}
        {!domain.enabled.active && (
          <Dropdown.Item
            onClick={() => showDeleteModal()}
            disabled={
              domain.isPrimary || domain.enabled.active || domain.deleted.active
            }
          >
            <MaterialIcon className="me-2">delete</MaterialIcon>
            Delete Domain
          </Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
