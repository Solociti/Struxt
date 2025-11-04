import { getTokenWallet } from "client/aiPilot/tokens/tokenWallet";
import { useLoadAsync } from "client/api/useLoadAsync";
import { ShowError } from "client/components/ShowError";
import { useCurrentProject } from "client/projects/ProjectContext";
import { formatStorageSize } from "common/format/storageSize";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { useNavigate } from "react-router";
import { useCurrentUser } from "../auth/userCurrentUser";
import { ProjectEnvInfo } from "./ProjectEnvInfo";

export function ShowProject({ project }: { project: ProjectDetails }) {
  const { user } = useCurrentUser();
  const { setProject } = useCurrentProject();
  const navigate = useNavigate();

  const {
    isLoading: walletIsLoading,
    response: wallet,
    error: walletError,
  } = useLoadAsync(async () => {
    if (!project.featureFlags.aiPilot.enabled) {
      return null;
    }

    return await getTokenWallet(project.projectId);
  }, [project.projectId]);

  return (
    <Card className="my-4">
      <Card.Body>
        {/* Project header */}
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fs-4 fw-bold">{project.name || "Project Name"}</h2>
            <p className="text-muted">{project.description}</p>
          </Col>

          {user && user.hasPermission("struxt.editor") && (
            <Col xs="auto">
              <Button
                variant="outline-primary"
                href={"/dashboard/editor/?projectId=" + project.projectId}
                target="_blank"
                as="a"
                className="me-2"
              >
                Edit
              </Button>

              <Button
                variant="outline-info"
                onClick={() => {
                  /* Handle settings click */
                  setProject({
                    projectId: project.projectId,
                    name: project.name,
                    description: project.description,
                  });
                  navigate("/metrics");
                }}
              >
                Metrics
              </Button>

              <Button
                variant="outline-secondary"
                onClick={() => {
                  /* Handle settings click */
                  setProject({
                    projectId: project.projectId,
                    name: project.name,
                    description: project.description,
                  });
                  navigate("/settings");
                }}
              >
                Settings
              </Button>
            </Col>
          )}
        </Row>

        {/* Environments section */}
        <Row className="mb-4">
          {/* Staging Environment */}
          <Col md={6} className="mb-3 mb-md-0">
            <ProjectEnvInfo
              envData={project.staging}
              envLabel="staging"
              project={project}
            />
          </Col>

          {/* Production Environment */}
          <Col md={6}>
            <ProjectEnvInfo
              envData={project.production}
              envLabel="production"
              project={project}
            />
          </Col>
        </Row>

        {/* AI Pilot usage details */}
        {wallet ? (
          <div className="mb-4">
            <h3 className="fs-5 fw-semibold mb-2">AI Pilot Tokens</h3>

            <ShowError error={walletError} />

            <div>
              <div className="d-flex align-items-center mt-3 gap-2">
                <h6 className="my-0 fw-semibold">Prepaid Available:</h6>
                <div>{wallet.prepaidBalance.toLocaleString()}</div>
              </div>

              <div className="d-flex justify-content-between gap-2 mt-3">
                <span>{Math.floor(wallet.monthlyUsage).toLocaleString()}</span>
                <h6 className="my-0">Monthly</h6>
                <span>
                  {Math.floor(wallet.monthlyAllowance).toLocaleString()}
                </span>
              </div>
              <ProgressBar
                max={wallet.monthlyAllowance}
                now={wallet.monthlyUsage}
              />

              {wallet.monthlyUsage > wallet.monthlyAllowance && (
                <>
                  <div className="d-flex justify-content-between gap-2 mt-3">
                    <span>
                      {Math.floor(
                        wallet.monthlyUsage - wallet.monthlyAllowance
                      ).toLocaleString()}
                    </span>
                    <h6 className="my-0">Borrowed</h6>
                    <span>
                      {Math.floor(wallet.emergencyLimit).toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar
                    max={wallet.emergencyLimit}
                    now={wallet.monthlyUsage - wallet.monthlyAllowance}
                    variant="warning"
                  />
                </>
              )}
            </div>
          </div>
        ) : null}

        {walletIsLoading ? (
          <p className="text-center">
            <Spinner animation="border" />
            <br />
            Loading...
          </p>
        ) : null}

        {/* Total Site Storage Used */}
        <div className="mb-4">
          <h3 className="fs-5 fw-semibold mb-2">Storage Used</h3>
          <div className="d-flex justify-content-between mb-2">
            <small className="text-muted">
              {formatStorageSize(project.storage.usedBytes)}
            </small>
            <small className="text-muted">
              {formatStorageSize(project.storage.maxBytes)}
            </small>
          </div>
          <ProgressBar
            variant={
              project.storage.usedBytes / project.storage.maxBytes > 0.8
                ? "danger"
                : "primary"
            }
            now={Math.min(
              100,
              (project.storage.usedBytes / project.storage.maxBytes) * 100
            )}
          />
        </div>

        {/* Forms section */}
        <div>
          <h3 className="fs-5 fw-semibold mb-2">Forms</h3>
          {project.forms?.length > 0 ? (
            <Table striped bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th className="small fw-medium">Form Name</th>
                  <th className="small fw-medium">Submissions (30 days)</th>
                </tr>
              </thead>
              <tbody>
                {project.forms.map((form, i) => (
                  <tr key={i}>
                    <td>{form.formName}</td>
                    <td>{form.submissionCount}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted small">No form submissions</p>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
