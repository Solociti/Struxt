import MaterialIcon from "client/components/MaterialIcon";
import { useHtmlId } from "client/components/useHtmlId";
import { formatDate } from "common/format/date";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { AddDomainModal } from "./AddDomainModal";
import { DomainList } from "./DomainList";

export function EnvironmentSettings({
  environment,
  project,
  refreshProject,
}: {
  environment: EnvironmentTypes;
  project: ProjectDetails;
  refreshProject: () => void;
}) {
  const { id } = useHtmlId();
  const [showAddDomain, setShowAddDomain] = useState(false);

  const envData =
    environment === "production" ? project.production : project.staging;

  return (
    <Row className="g-4">
      <Col md={6}>
        <div className="d-flex align-items-start mb-4">
          <div className="flex-grow-1">
            <p className="text-muted small fw-medium mb-1">Last published by</p>
            {project.publish[environment].active ? (
              <p className="small">
                {project.publish[environment].displayName}
                {" on "}
                {formatDate(project.publish[environment].date, true)}
              </p>
            ) : (
              <p className="small text-muted">No recent publishes</p>
            )}
          </div>

          {/* <Button 
            variant="primary" 
            size="sm" 
            className="ms-3"
          >
            Deploy to Production
          </Button> */}
        </div>

        <div className="mt-4">
          <h4 className="mb-3 fw-medium fs-5">Security Settings</h4>

          <Form onSubmit={(e) => e.preventDefault()}>
            <div className="d-flex align-items-center justify-content-around">
              <Form.Check
                type="switch"
                id={id("require-ssl")}
                name="require-ssl"
                defaultChecked={envData.forceSsl}
                label="Require SSL"
              />

              <Form.Check
                type="switch"
                id={id("hsts")}
                name="hsts"
                defaultChecked={envData.hsts}
                label="HSTS"
                disabled={!envData.forceSsl}
              />
            </div>
          </Form>
        </div>

        <div className="mt-4">
          <h4 className="mb-3 fw-medium fs-5">Domains</h4>

          <div className="mb-4">
            <DomainList
              domains={project[environment].domains}
              environment={environment}
              projectId={project.projectId}
              refreshProject={refreshProject}
            />
          </div>

          {/* Replace the existing code with this */}
          <div className="mt-4">
            <Button variant="primary" onClick={() => setShowAddDomain(true)}>
              <MaterialIcon>add</MaterialIcon>
              Domain
            </Button>

            <AddDomainModal
              show={showAddDomain}
              onHide={() => setShowAddDomain(false)}
              projectId={project.projectId}
              environment={environment}
              onAdd={() => {
                refreshProject();
              }}
            />
          </div>
        </div>
      </Col>

      <Col md={6}>
        <h3 className="mb-4 fw-medium">Preview</h3>
        <div
          className="bg-light border rounded d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
          style={{ height: "16rem" }}
        >
          {project.publish[environment].screenshotUrl ? (
            <img
              src={project.publish[environment].screenshotUrl}
              alt="Site preview"
              className="img-fluid"
            />
          ) : (
            <span className="text-muted">No preview available</span>
          )}
        </div>
      </Col>
    </Row>
  );
}
