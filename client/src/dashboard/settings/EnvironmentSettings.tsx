import MaterialIcon from "client/components/MaterialIcon";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { useHtmlId } from "client/components/useHtmlId";
import { formatDate } from "common/format/date";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { AddDomainModal } from "./AddDomainModal";
import { DomainList } from "./DomainList";
import { updateDomainDetails } from "./domains";

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

  const [sslValue, setSslValue] = useState(envData.forceSsl);
  const [hstsValue, setHstsValue] = useState(envData.hsts);

  useEffect(() => {
    setSslValue(envData.forceSsl);
    setHstsValue(envData.hsts);
  }, [envData.forceSsl, envData.hsts]);

  const form = useRef<HTMLFormElement>(null);

  const updateCb = useAsyncCallback(
    async ({
      ssl: updatedSsl,
      hsts: updatedHsts,
    }: {
      ssl?: boolean;
      hsts?: boolean;
    }) => {
      try {
        if (typeof updatedSsl === "boolean") {
          setSslValue(updatedSsl);
        }
        if (typeof updatedHsts === "boolean") {
          setHstsValue(updatedHsts);
        }

        const response = await updateDomainDetails(
          project.projectId,
          environment,
          [
            {
              forceSsl: typeof updatedSsl === "boolean" ? updatedSsl : sslValue,
              hsts: typeof updatedHsts === "boolean" ? updatedHsts : hstsValue,
            },
          ]
        );

        if (
          response.updatedEnv.forceSsl !== envData.forceSsl ||
          response.updatedEnv.hsts !== envData.hsts
        ) {
          refreshProject();
        }
      } catch (err) {
        setSslValue(envData.forceSsl);
        setHstsValue(envData.hsts);

        throw err;
      }
    },
    {
      toastError: true,
    }
  );

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

          <p className="text-muted small mb-3">
            Any changes will be applied on the next publish.
          </p>

          <Form ref={form} onSubmit={(e) => e.preventDefault()}>
            <div className="d-flex align-items-center justify-content-around">
              <Form.Check
                type="switch"
                id={id("require-ssl")}
                name="require-ssl"
                checked={envData.forceSsl}
                onChange={(e) => {
                  updateCb.callback({ ssl: e.target.checked });
                }}
                label="Require SSL"
              />

              <Form.Check
                type="switch"
                id={id("hsts")}
                name="hsts"
                checked={envData.hsts}
                onChange={(e) => {
                  updateCb.callback({ hsts: e.target.checked });
                }}
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
