import { PublishApi } from "common/api/publish/publish";
import { customError } from "common/custom-error/custom-error";
import { roles } from "common/models/user/Roles";
import { registerApi } from "../registerApi";
import { publishProject } from "./publishProject";

const validTypes = ["staging", "production"];

registerApi<PublishApi>("/api/publish/:projectId").post(
  [roles.struxt.publish.staging, roles.struxt.publish.production],
  async ({ params, user, body }) => {
    const publishEnv = body.type;
    const projectId = params.projectId;

    // check if the publish type is valid
    if (!validTypes.includes(publishEnv)) {
      throw customError(400, `Type '${publishEnv}' not implemented!`);
    }

    // perform some sanity checks
    if (body.projectId !== projectId) {
      throw customError(400, "Project id mismatch!");
    }

    // check if the user has access to publish the desired outcome
    if (!user.hasPermission(roles.struxt.admin)) {
      if (
        publishEnv === "production" &&
        !user.hasPermission(roles.struxt.publish.production)
      ) {
        throw customError(
          403,
          "You do not have permission to publish to production!"
        );
      }

      if (
        publishEnv === "production" &&
        !user.hasProjectPermission(projectId, roles.projects.publish.production)
      ) {
        throw customError(
          403,
          "You do not have permission to publish this site to production!"
        );
      }

      if (
        publishEnv === "staging" &&
        !user.hasPermission(roles.struxt.publish.staging)
      ) {
        throw customError(
          403,
          "You do not have permission to publish to staging!"
        );
      }

      if (
        publishEnv === "staging" &&
        !user.hasProjectPermission(projectId, roles.projects.publish.staging)
      ) {
        throw customError(
          403,
          "You do not have permission to publish this site to staging!"
        );
      }
    }

    // publish the project
    const { publishId } = await publishProject(
      projectId,
      publishEnv,
      body.files,
      {
        userId: user.id,
        displayName: user.name,
      }
    );

    return {
      success: true,
      publishId,
    };
  }
);
