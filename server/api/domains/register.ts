import { roles } from "common/models/user/Roles";
import express from "express";
import { protectEndpoint } from "server/auth/protectEndpoint";
import { userFromReq } from "../auth/userFromReq";
import { getDomain } from "./getDomain";
import { customError } from "common/custom-error/custom-error";

export const router = express.Router();

router.use(protectEndpoint([roles.struxt.editor, roles.struxt.admin]));

router.get("/:domainId", async (req, res) => {
  const domainId = req.params.domainId;

  // check if the user has access to the project and domain
  const user = await userFromReq(req);

  const domain = await getDomain(parseInt(domainId));

  // check if the user has access to the project id
  if (
    !user.hasProjectPermission(domain.siteId.toString(), [
      roles.projects.edit,
      roles.projects.admin,
    ])
  ) {
    throw customError(403, "You do not have permission to view this domain.");
  }

  res.json({ domain });
});

router.post("/", async (req, res) => {
  const { domainId } = req.body;

  // check if the user has access to the project and domain
  const user = await userFromReq(req);

  const domain = await getDomain(parseInt(domainId));

  // check if the user has access to the project id
  if (
    !user.hasProjectPermission(domain.siteId.toString(), [
      roles.projects.edit,
      roles.projects.admin,
    ])
  ) {
    throw customError(403, "You do not have permission to view this domain.");
  }

  // TODO: update the domain with the list of changes

  res.json({ domain });
});
