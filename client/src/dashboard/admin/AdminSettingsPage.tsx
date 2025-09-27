import Card from "react-bootstrap/Card";
import { ShowAiPilotModels } from "./aiPilot/ShowAiPilotModels";
import Container from "react-bootstrap/Container";

export default function AdminSettings() {
  return (
    <Container>
      <h1 className="text-center">Admin Settings</h1>

      <ShowAiPilotModels />

      <Card className="my-4">
        <Card.Header>AI Pilot Default Messages</Card.Header>
        <Card.Body></Card.Body>
      </Card>
    </Container>
  );
}
