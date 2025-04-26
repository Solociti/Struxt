import { formatDate } from "common/format/date";
import {
  EnvironmentTypes,
  ProjectEnvSettings,
} from "common/models/projects/Environment";
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
  envData: ProjectEnvSettings;
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
            {envData.domains.map((domain, index) => (
              <ListGroup.Item key={index} className="px-0 py-1 border-0">
                <a href={`https://${domain.domain}`} className="link-primary">
                  {domain.domain}
                </a>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>

        <div className="flex-grow-1 mb-3">
          <p className="text-muted small fw-medium mb-1">Last published by</p>
          {project.publish[envLabel].active ? (
            <p className="small">
              {project.publish[envLabel].displayName}
              {" on "}
              {formatDate(project.publish[envLabel].date)}
            </p>
          ) : (
            <p className="small text-muted">No recent publishes</p>
          )}
        </div>

        <div>
          <h4 className="h6 mb-2">Preview</h4>
          {project.publish[envLabel].screenshotUrl ? (
            <Card.Img
              src={project.publish[envLabel].screenshotUrl}
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
