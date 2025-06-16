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
          <ListGroup>
            {envData.domains.map((domain, index) => (
              <ListGroup.Item
                key={index}
                as="a"
                action
                active={false}
                className=""
                disabled={!domain.enabled.active}
                href={`https://${domain.domain}`}
                referrerPolicy="no-referrer"
                target="_blank"
              >
                {domain.domain}
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
          <div
            className="bg-light border rounded d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
            style={{ height: "16rem" }}
          >
            {project.publish[envLabel].screenshotUrl ? (
              <img
                src={project.publish[envLabel].screenshotUrl}
                alt="Site preview"
                className="img-fluid"
                style={{
                  objectFit: "cover",
                  objectPosition: "top",
                  width: "100%",
                  height: "100%",
                }}
              />
            ) : (
              <span className="text-secondary">No preview available</span>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
