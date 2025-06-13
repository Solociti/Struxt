import { useLoadAsync } from "client/api/useLoadAsync";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { ShowError } from "client/components/ShowError";
import {
  useAsyncCallback,
  useAsyncDebouncedCallback,
} from "client/components/useAsyncCallback";
import { useHtmlId } from "client/components/useHtmlId";
import {
  EnvironmentTypes,
  ProjectEnvSettings,
} from "common/models/projects/Environment";
import { useRef, useState } from "react";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Spinner from "react-bootstrap/Spinner";
import {
  checkDomainAvailability,
  getDomainInfo,
  registerDomain,
} from "./domains";

interface AddDomainModalProps {
  show: boolean;
  onHide: () => void;

  projectId: string;
  environment: EnvironmentTypes;

  onAdd: (domain: string, env: ProjectEnvSettings) => void;
}

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
  onAdd,
}: AddDomainModalProps) {
  const { id } = useHtmlId();
  const form = useRef<HTMLFormElement>(null);

  // load the domain info
  const {
    error,
    isLoading: loadingDomainInfo,
    response: domainInfo,
  } = useLoadAsync(async () => {
    if (!show) {
      return null;
    }

    return await getDomainInfo();
  }, [show]);

  const [domainType, setDomainType] = useState("free");

  /**
   * Get the data from the form
   *
   * @returns
   */
  const getFormData = () => {
    if (!form.current) {
      return;
    }
    const formData = new FormData(form.current);

    const domainType = formData.get("domain-type") as "custom" | "free";
    const customDomain = formData.get("custom-domain") as string;
    const freeSubdomain = formData.get("free-subdomain") as string;

    return {
      domainType,
      customDomain: domainType === "custom" ? customDomain : "",
      freeSubdomain: domainType === "free" ? freeSubdomain : "",
    };
  };

  const submitCb = useAsyncCallback(async () => {
    const data = getFormData();
    if (!data) {
      return;
    }

    const domain =
      data.domainType === "custom" ? data.customDomain : data.freeSubdomain;
    if (!domain || domain.length < 3) {
      throw new Error("Please provide a valid domain or subdomain.");
    }

    // register a new domain for the project
    const response = await registerDomain(
      projectId,
      environment,
      data.customDomain || "",
      data.freeSubdomain || ""
    );

    onAdd(domain, response.environment);
    onHide();
  });

  const checkDomainCb = useAsyncDebouncedCallback(
    async () => {
      const data = getFormData();
      if (!data) {
        return;
      }

      if (!data.customDomain && !data.freeSubdomain) {
        return null;
      }

      try {
        return await checkDomainAvailability(
          projectId,
          data.customDomain,
          data.freeSubdomain
        );
      } catch {
        return false;
      }
    },
    1000,
    {}
  );

  const availableBadge = (() => {
    if (checkDomainCb.isActive) {
      return <Spinner animation="border" size="sm" />;
    }

    if (checkDomainCb.result === null) {
      return null;
    }

    if (checkDomainCb.result) {
      return <Badge bg="primary">Available</Badge>;
    }

    return <Badge bg="warning">Not Available</Badge>;
  })();

  return (
    <SimpleModal
      title="Add Domain"
      show={show}
      onHide={onHide}
      footer={
        <>
          <IconButton icon="close" variant="secondary" onClick={onHide}>
            Cancel
          </IconButton>
          <IconButton
            disabled={!checkDomainCb.result || checkDomainCb.isActive}
            icon="add"
            onClick={submitCb.callback}
            spinner={submitCb.isLoading}
            variant="primary"
          >
            Domain
          </IconButton>
        </>
      }
    >
      <ShowError error={error} />
      <ShowError error={submitCb.error} />

      {loadingDomainInfo && (
        <div className="d-flex justify-content-center align-items-center mb-3">
          <Spinner animation="border" size="sm" className="me-2" />
          <small>Loading...</small>
        </div>
      )}

      <Form
        ref={form}
        onChange={checkDomainCb.callback}
        onSubmit={(e) => e.preventDefault()}
      >
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <Form.Check
              type="radio"
              id={id("domain-type-custom")}
              name="domain-type"
              value="custom"
              label="Custom Domain"
              onChange={(e) => setDomainType(e.target.value)}
            />

            {domainType === "custom" && availableBadge}
          </div>

          <Form.Control
            type="text"
            placeholder="yourdomain.com"
            className="mt-2"
            name="custom-domain"
            disabled={domainType === "free"}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <Form.Check
              type="radio"
              id="domain-type-free"
              name="domain-type"
              value="free"
              defaultChecked
              label="Free Subdomain"
              onChange={(e) => setDomainType(e.target.value)}
            />

            {domainType === "free" && availableBadge}
          </div>

          <InputGroup className="mt-2">
            <Form.Control
              type="text"
              placeholder="your-project"
              name="free-subdomain"
              disabled={domainType === "custom"}
            />
            <InputGroup.Text>
              .{domainInfo?.freeBaseDomain || ".."}
            </InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Form>
    </SimpleModal>
  );
}
