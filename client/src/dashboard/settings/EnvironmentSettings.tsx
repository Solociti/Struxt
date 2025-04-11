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
}: {
  environment: EnvironmentTypes;
  project: ProjectDetails;
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
            {envData.published.timestamp ? (
              <p className="small">
                {envData.published.displayName}
                {" on "}
                {formatDate(envData.published.timestamp, true)}
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
                disabled
              />

              <Form.Check
                type="switch"
                id={id("hsts")}
                name="hsts"
                defaultChecked={envData.hsts}
                label="HSTS"
                disabled
              />
            </div>
          </Form>
        </div>

        <div className="mt-4">
          <h4 className="mb-3 fw-medium fs-5">Domains</h4>

          <div className="mb-4">
            <DomainList
              domains={project.domains.filter(
                (d) => d.environment === environment
              )}
            />
          </div>

          {/* Replace the existing code with this */}
          <div className="mt-4">
            <Button
              disabled
              variant="primary"
              onClick={() => setShowAddDomain(true)}
            >
              Add Domain
            </Button>
            <AddDomainModal
              show={showAddDomain}
              onHide={() => setShowAddDomain(false)}
              projectId={project.id}
              environment={environment}
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
          {envData.screenshot ? (
            <img
              src={envData.screenshot}
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
