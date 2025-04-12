import { useLoadAsync } from "client/api/useLoadAsync";
import { useCurrentProject } from "client/projects/ProjectContext";
import { getProjectDetails } from "client/projects/projects";
import { formatStorageSize } from "common/format/storageSize";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { EnvironmentSettings } from "./EnvironmentSettings";

export default function SettingsContent() {
  const { project } = useCurrentProject();

  // load the project
  const {
    response: projectDetails,
    isLoading: loadingProjectDetails,
    // error: projectDetailsError,
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
                    disabled
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
                disabled
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
