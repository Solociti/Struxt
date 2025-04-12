import { DomainDetails } from "common/models/projects/Domains";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";

/**
 * Show the list of domains
 *
 * @param param0
 * @returns
 */
export function DomainList({ domains }: { domains: DomainDetails[] }) {
  return (
    <ListGroup>
      {domains.map((domain) => (
        <DomainListItem key={domain.id} domain={domain} />
      ))}
    </ListGroup>
  );
}

function DomainListItem({ domain }: { domain: DomainDetails }) {
  return (
    <ListGroup.Item
      key={domain.id}
      className="p-1 d-flex align-items-center flex-wrap"
    >
      <div className="d-flex align-items-center">
        {/* TODO: add a icon for active sites */}
        <i className="fas fa-globe me-2"></i>
        {domain.isPrimary && <span className="me-2">🟢</span>}
        <span>{domain.domain}</span>
      </div>

      <div className="d-flex align-items-center flex-grow-1 justify-content-end">
        <Button
          variant="link"
          size="sm"
          className="text-decoration-none"
          disabled
        >
          Edit
        </Button>
      </div>
    </ListGroup.Item>
  );
}
