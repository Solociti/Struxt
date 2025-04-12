import { useHtmlId } from "client/components/useHtmlId";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Modal from "react-bootstrap/Modal";

/**
 * Modal to add a new domain to the project
 *
 * @param param0
 * @returns
 */
export function AddDomainModal({
  show,
  onHide,
  projectId,
  environment,
}: {
  show: boolean;
  onHide: () => void;
  projectId: string;
  environment: EnvironmentTypes;
}) {
  const { id } = useHtmlId();
  const form = useRef<HTMLFormElement>(null);

  const [domainType, setDomainType] = useState("free");

  const submit = async () => {
    if (form.current) {
      const formData = new FormData(form.current);
      const domainType = formData.get("domain-type");
      const customDomain = formData.get("custom-domain");
      const freeSubdomain = formData.get("free-subdomain");

      // Handle the submission logic here
      console.log({
        customDomain,
        domainType,
        environment,
        freeSubdomain,
        projectId,
      });
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add a Domain</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form ref={form} onSubmit={(e) => e.preventDefault()}>
          <Form.Group className="mb-3">
            <Form.Check
              type="radio"
              id={id("domain-type-custom")}
              name="domain-type"
              value="custom"
              label="Custom Domain"
              onChange={(e) => setDomainType(e.target.value)}
            />
            <Form.Control
              type="text"
              placeholder="yourdomain.com"
              className="mt-2"
              name="custom-domain"
              disabled={domainType === "free"}
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
              onChange={(e) => setDomainType(e.target.value)}
            />
            <InputGroup className="mt-2">
              <Form.Control
                type="text"
                placeholder="your-project"
                name="free-subdomain"
                disabled={domainType === "custom"}
              />
              <InputGroup.Text>.struxt.solociti.com</InputGroup.Text>
            </InputGroup>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit}>
          Add Domain
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
