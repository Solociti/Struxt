import { useLoadAsync } from "client/api/useLoadAsync";
import { useHtmlId } from "client/components/useHtmlId";
import { useCurrentProject } from "client/projects/ProjectContext";
import { getProjectDetails } from "client/projects/projects";
import { formatStorageSize } from "common/format/storageSize";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { useId, useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

export default function SettingsContent() {
  const { id } = useHtmlId();

  const { project } = useCurrentProject();

  // load the project
  const {
    response: projectDetails,
    isLoading: loadingProjectDetails,
    error: projectDetailsError,
  } = useLoadAsync(async () => {
    if (project.id === "*") {
      return null;
    }

    // Load project details
    return await getProjectDetails(project.id);
  }, [project.id]);

  if (project.id === "*") {
    return (
      <Container className="py-4">
        <h1 className="fw-bold mb-3">Settings</h1>
        <p>Please select a project to continue...</p>
      </Container>
    );
  }

  if (loadingProjectDetails) {
    return (
      <Container className="py-4">
        <h1 className="fw-bold mb-3">Settings</h1>
        <p>Loading...</p>
      </Container>
    );
  }

  if (projectDetails) {
    return (
      <Container>
        <h1 className="fw-bold mb-4">Settings</h1>

        <Card className="my-4">
          <Card.Header as="h5">Project Details</Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="projectName">
                  <Form.Label>Project Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={project.name}
                    onChange={(e) => {
                      // handle project name change
                      console.log({ name: e.target.value });
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="projectId">
                  <Form.Label>Project Id</Form.Label>
                  <Form.Control type="text" value={project.id} disabled />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group controlId="projectDescription" className="mt-3">
              <Form.Label>Project Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={project.description}
                onChange={(e) => {
                  // handle project description change
                  console.log({ description: e.target.value });
                }}
                placeholder="Project Description"
              />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* TODO: add users access control */}

        <Card className="my-4">
          <Card.Header as="h5">Storage Usage</Card.Header>
          <Card.Body>
            <div className="d-flex justify-content-between mb-2">
              <small className="text-muted">
                {formatStorageSize(projectDetails.storage.usedBytes)}
              </small>
              <small className="text-muted">
                {formatStorageSize(projectDetails.storage.maxBytes)}
              </small>
            </div>
            <ProgressBar
              variant={
                projectDetails.storage.usedBytes /
                  projectDetails.storage.maxBytes >
                0.8
                  ? "danger"
                  : "primary"
              }
              now={Math.min(
                100,
                (projectDetails.storage.usedBytes /
                  projectDetails.storage.maxBytes) *
                  100
              )}
            />
          </Card.Body>
        </Card>

        <Card className="my-4">
          <Card.Body>
            <Tabs
              defaultActiveKey="production"
              id="environment-tabs"
              className="mb-3"
            >
              <Tab eventKey="production" title="Production">
                <EnvironmentSettings
                  environment="production"
                  project={projectDetails}
                />
              </Tab>
              <Tab eventKey="staging" title="Staging">
                <EnvironmentSettings
                  environment="staging"
                  project={projectDetails}
                />
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="fw-bold mb-3">Settings</h1>
      <p>Project details not found.</p>
    </Container>
  );
}

function EnvironmentSettings({
  environment,
  project,
}: {
  environment: EnvironmentTypes;
  project: ProjectDetails;
}) {
  const htmlId = useId();

  const [showAddDomain, setShowAddDomain] = useState(false);

  return (
    <Row className="g-4">
      <Col md={6}>
        <h3 className="mb-4 text-capitalize">{environment} Environment</h3>

        <div className="d-flex align-items-start mb-4">
          <div className="flex-grow-1">
            <p className="text-muted small fw-medium">Last published by</p>
            <p className="small">John Doe on April 5, 2025</p>
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
          <h4 className="mb-3 fw-medium">Custom Domains</h4>
          <Card className="mb-4">
            <ListGroup variant="flush">
              <ListGroup.Item className="py-3 d-flex justify-content-between align-items-center">
                <div>
                  <span className="fw-medium small">example.com</span>
                  <Badge bg="success" className="ms-2">
                    Primary
                  </Badge>
                </div>
                <div>
                  <Button variant="link" className="text-secondary p-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M11 5a1 1 0 112 0v8a1 1 0 11-2 0V5zm-6 4a1 1 0 112 0v4a1 1 0 11-2 0V9z" />
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
              </ListGroup.Item>
              <ListGroup.Item className="py-3 d-flex justify-content-between align-items-center">
                <div>
                  <span className="fw-medium small">www.example.com</span>
                  <Badge bg="primary" className="ms-2">
                    SSL Enabled
                  </Badge>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="link" className="text-primary p-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path
                        fillRule="evenodd"
                        d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                  <Button variant="link" className="text-danger p-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
              </ListGroup.Item>
            </ListGroup>
          </Card>

          {/* Replace the existing code with this */}
          <div className="mt-4">
            <Button variant="primary" onClick={() => setShowAddDomain(true)}>
              Add Domain
            </Button>
            <AddDomainModal
              show={showAddDomain}
              onHide={() => setShowAddDomain(false)}
            />
          </div>
        </div>
      </Col>

      <Col md={6}>
        <h3 className="mb-4 fw-medium">Preview</h3>
        <div
          className="bg-light border rounded d-flex align-items-center justify-content-center"
          style={{ height: "16rem" }}
        >
          <img
            src="/api/placeholder/400/320"
            alt="Production site preview"
            className="img-fluid rounded shadow"
          />
        </div>
      </Col>
    </Row>
  );
}

function AddDomainModal({
  show,
  onHide,
}: {
  show: boolean;
  onHide: () => void;
}) {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add a Domain</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Check
              type="radio"
              id="domain-type-custom"
              name="domain-type"
              value="custom"
              label="Custom Domain"
            />
            <Form.Control
              type="text"
              placeholder="yourdomain.com"
              className="mt-2"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="radio"
              id="domain-type-free"
              name="domain-type"
              value="free"
              defaultChecked
              label="Free Subdomain"
            />
            <InputGroup className="mt-2">
              <Form.Control type="text" placeholder="your-project" />
              <InputGroup.Text>.struxt.solociti.com</InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="enable-ssl"
              defaultChecked
              label="Enable SSL"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>SSL Email (for certificate notifications)</Form.Label>
            <Form.Control
              type="email"
              id="ssl-email"
              placeholder="you@example.com"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary">Add Domain</Button>
      </Modal.Footer>
    </Modal>
  );
}
