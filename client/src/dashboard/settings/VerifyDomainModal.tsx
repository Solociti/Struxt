import { useLoadAsync } from "client/api/useLoadAsync";
import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { ShowError } from "client/components/ShowError";
import { showToastTop } from "client/components/ToastTop";
import { DomainDnsVerifyApi } from "common/api/domains/domains";
import {
  EnvironmentTypes,
  ProjectDomain,
} from "common/models/projects/Environment";
import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { getDomainInfo, verifyDomainDns } from "./domains";

interface VerifyDomainModalProps {
  show: boolean;
  onHide: () => void;

  domain: ProjectDomain;
  projectId: string;
  environment: EnvironmentTypes;

  /**
   * Gets called when the domain verification changes
   *
   * @returns
   */
  onVerify: (data: DomainDnsVerifyApi["PostResponse"]) => void;
}

export default function VerifyDomainModal({
  show,
  onHide,
  domain,
  projectId,
  environment,
  onVerify,
}: VerifyDomainModalProps) {
  const [reload, setReload] = useState(0);

  const { error, isLoading, response } = useLoadAsync(async () => {
    if (!show) {
      return null;
    }

    return await getDomainInfo();
  }, [show]);

  const {
    error: verifyError,
    isLoading: isLoadingVerify,
    response: responseVerify,
  } = useLoadAsync(async () => {
    if (!show || !domain.domain) {
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const response = await verifyDomainDns(
      projectId,
      environment,
      domain.domain
    );

    onVerify(response);

    return response;
  }, [show, domain.domain, reload]);

  const isRootDomain =
    responseVerify?.isRootDomain || domain.domain.split(".").length === 2;
  const isValid = responseVerify?.isValid || false;

  // setup the DNS records to show
  const cnameRecord = (
    <ShowRecord type="CNAME" value={response?.dnsSettings.proxy || "..."} />
  );

  const aRecords = response?.dnsSettings.ips.map((ip, index) => (
    <ShowRecord key={index} type="A" value={ip} />
  ));

  return (
    <SimpleModal
      title="Verify DNS"
      show={show}
      onHide={onHide}
      footer={
        <IconButton icon="close" variant="secondary" onClick={onHide}>
          Close
        </IconButton>
      }
    >
      {isLoading && (
        <div className="my-2 d-flex justify-content-center align-items-center">
          <Spinner animation="border" size="sm" className="me-2" /> Loading...
        </div>
      )}

      <ShowError error={error} />
      <ShowError error={verifyError} />

      <Group>
        <Form.Control placeholder="Domain" value={domain.domain} readOnly />

        <IconButton
          icon="refresh"
          spinner={isLoadingVerify}
          variant={isValid ? "outline-secondary" : "outline-primary"}
          onClick={() => {
            setReload((r) => r + 1);
          }}
        >
          Verify
        </IconButton>
      </Group>

      {isValid && (
        <Alert variant="success" className="my-3">
          <Alert.Heading>Domain Verification Success</Alert.Heading>
          <p>
            {domain.domain} is properly configured and resolving to the correct
            IP addresses.
          </p>
        </Alert>
      )}

      {!isValid && !isLoadingVerify && (
        <Alert variant="warning" className="my-3">
          <Alert.Heading>Domain Not Verified</Alert.Heading>
          <p>
            Please configure your DNS settings according to the recommendations
            below. DNS changes can take up to 24 hours to propagate globally.
          </p>
        </Alert>
      )}

      <h4 className="mt-2">Recommended DNS Settings</h4>
      {isRootDomain ? aRecords : cnameRecord}

      <h6 className="mt-3">Alternative Settings</h6>
      {isRootDomain ? cnameRecord : aRecords}

      <h4 className="mt-3">Current DNS Settings</h4>

      {isLoadingVerify && (
        <div className="my-2 d-flex justify-content-center align-items-center">
          <Spinner animation="border" size="sm" className="me-2" /> Verifying...
        </div>
      )}

      {responseVerify && responseVerify.dnsRecords.length === 0 && (
        <div className="my-2 small text-muted">No DNS records found.</div>
      )}

      {responseVerify?.dnsRecords.map((record, index) => (
        <ShowRecord
          key={index}
          type={record.type}
          value={record.value}
          valid={record.valid}
          inValid={!record.valid}
        />
      ))}
    </SimpleModal>
  );
}

function ShowRecord({
  type,
  value,
  valid,
  inValid,
}: {
  type: string;
  value: string;
  valid?: boolean;
  inValid?: boolean;
}) {
  let colour = "secondary";

  if (valid) {
    colour = "success";
  } else if (inValid) {
    colour = "danger";
  }

  return (
    <div
      style={{
        borderLeft: "4px solid",
      }}
      className={`rounded border-${colour} my-2`}
    >
      <div
        className={`alert alert-${colour} p-0 d-flex align-items-center p-2 m-0 rounded`}
      >
        <div className="d-flex align-items-center flex-grow-1">
          <Badge bg={colour} className="text-uppercase me-2">
            {type}
          </Badge>
          <div className="font-monospace">{value}</div>
        </div>

        <IconButton
          icon="content_copy"
          variant="link"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(value);

            showToastTop(
              "Copied to clipboard!",
              "content_copy",
              "success",
              3000
            );
          }}
        ></IconButton>
      </div>
    </div>
  );
}
