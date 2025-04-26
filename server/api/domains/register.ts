import { roles } from "common/models/user/Roles";
import { registerApi } from "../registerApi";

registerApi("/api/domains/register").post(
  [roles.struxt.editor, roles.struxt.admin],
  async ({}) => {
    // TODO: setup a new domain for a project

    return {
      message: "TODO: setup a new domain for a project",
    };
  }
);
