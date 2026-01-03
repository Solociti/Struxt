import "chart.js/auto";
import { useLoadAsync } from "client/api/useLoadAsync";
import { useCurrentProject } from "client/projects/ProjectContext";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";
import { Line } from "react-chartjs-2";
import { getMetrics } from "./getMetrics";

export default function MetricsPage() {
  const { project } = useCurrentProject();

  const { isLoading, response, error } = useLoadAsync(async () => {
    if (project.projectId === "*") {
      return null;
    }

    // Load project metrics
    return await getMetrics(project.projectId);
  }, [project.projectId]);

  if (project.projectId === "*") {
    return (
      <Container className="p-3">
        <h1 className="fw-bold mb-4">Metrics</h1>
        <p className="text-muted py-3">Please select a project.</p>
      </Container>
    );
  }

  return (
    <Container className="p-3">
      <h1 className="fw-bold mb-4">Metrics</h1>
      <h3 className="fw-bold mb-4">{project && project.name}</h3>

      {error && (
        <div>
          <h4 className="text-danger">{error.name}</h4>
          <p className="text-danger">
            {error.message || "An error occurred while loading metrics."}
          </p>

          <pre>
            <code>{JSON.stringify(error)}</code>
          </pre>
        </div>
      )}

      {/* render the list of charts */}
      <div>
        <Card>
          <Card.Header>
            <Card.Title>Page Views</Card.Title>
          </Card.Header>
          <div>
            {isLoading && <Spinner animation="border" size="sm" />}
            {response && response.data && (
              <Line
                data={response.data}
                options={{
                  responsive: true,
                }}
              />
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
}
