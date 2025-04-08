import { formatDate } from "common/format/date";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

/**
 * Show the project env value information
 *
 * @param param0
 * @returns
 */
export function ProjectEnvInfo({
  envData,
  envLabel,
  project,
}: {
  envData: any;
  project: ProjectDetails;
  envLabel: EnvironmentTypes;
}) {
  return (
    <Card>
      <Card.Body>
        <Card.Title as="h3" className="text-capitalize mb-3">
          {envLabel} Environment
        </Card.Title>

        <div className="mb-3">
          <h4 className="h6">Domains</h4>
          <ListGroup variant="flush">
            {project.domains
              .filter((d) => d.environment === envLabel)
              .map((domain) => (
                <ListGroup.Item key={domain.id} className="px-0 py-1 border-0">
                  <a href={`https://${domain.domain}`} className="link-primary">
                    {domain.domain}
                  </a>
                </ListGroup.Item>
              ))}
          </ListGroup>
        </div>

        <div className="mb-3">
          <h4 className="h6">Latest Publish</h4>
          <p>
            {envData.published.timestamp
              ? `Published on ${formatDate(envData.published.timestamp)} by ${
                  envData.published.displayName
                }`
              : "No recent publishes"}
          </p>
        </div>

        <div>
          <h4 className="h6 mb-2">Preview</h4>
          {envData.screenshot ? (
            <Card.Img
              src={envData.screenshot}
              alt="Staging site preview"
              style={{ height: "10rem", objectFit: "cover" }}
            />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center bg-light text-secondary border rounded"
              style={{ height: "10rem" }}
            >
              No preview available
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
