import { useCurrentUser } from "client/auth/userCurrentUser";
import { FormInput } from "client/components/FormInput";
import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import { useAsyncCallback } from "client/components/useAsyncCallback";
import { updateProjectDetails } from "client/projects/projects";
import { ProjectDetailsApi } from "common/api/projects/project";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { roles } from "common/models/user/Roles";
import Card from "react-bootstrap/Card";

interface ProjectFeaturesProps {
  projectDetails: ProjectDetails;

  refresh: () => void;
}

/**
 * Shows the list of project features and allows editing them.
 *
 * @param param0
 */
export function ProjectFeatures({
  projectDetails,
  refresh,
}: ProjectFeaturesProps) {
  const { hasPermission } = useCurrentUser();
  const isAdmin = hasPermission(roles.struxt.admin);

  const { aiPilot } = projectDetails.featureFlags;

  const updateValue = useAsyncCallback(
    async (
      propPath: ProjectDetailsApi["PostBody"]["propPath"],
      value: ProjectDetailsApi["PostBody"]["value"]
    ) => {
      await updateProjectDetails(projectDetails.projectId, propPath, value);
      refresh();
    },
    {
      toastError: true,
    }
  );

  return (
    <div className="d-flex flex-wrap">
      <Card className="my-4">
        <Card.Header
          as="div"
          className="d-flex justify-content-between align-items-center gap-2"
        >
          <h5 className="mb-0">AI Pilot</h5>
          <IconButton
            size="sm"
            variant={aiPilot.enabled ? "outline-success" : "outline-secondary"}
            icon={aiPilot.enabled ? "check_box" : "check_box_outline_blank"}
            spinner={updateValue.isLoading}
            disabled={!isAdmin || updateValue.isLoading}
            onClick={async () => {
              // toggle ai pilot enabled
              updateValue.callback(
                "featureFlags.aiPilot.enabled",
                !aiPilot.enabled
              );
            }}
          >
            {aiPilot.enabled ? "Enabled" : "Disabled"}
          </IconButton>
        </Card.Header>
        <Card.Body>
          <Group prepend="Tokens" append="/ month">
            <FormInput
              type="number"
              value={aiPilot.settings.tokensPerMonth.toString()}
              disabled={!isAdmin || !aiPilot.enabled}
              style={{ maxWidth: "10em" }}
              onRealChange={(value) => {
                const tokens = parseInt(value) || 0;

                updateValue.callback(
                  "featureFlags.aiPilot.settings.tokensPerMonth",
                  tokens
                );
              }}
            />
          </Group>
        </Card.Body>
      </Card>
    </div>
  );
}
