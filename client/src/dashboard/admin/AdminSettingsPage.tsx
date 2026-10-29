import Container from "react-bootstrap/Container";
import { ShowAiPilotModels } from "./aiPilot/ShowAiPilotModels";
import { ShowAiPilotPrompts } from "./aiPilot/ShowAiPilotPrompts";

export default function AdminSettings() {
  return (
    <Container className="mt-3">
      <h1 className="text-center">Admin Settings</h1>

      <ShowAiPilotModels />

      <ShowAiPilotPrompts />
    </Container>
  );
}
