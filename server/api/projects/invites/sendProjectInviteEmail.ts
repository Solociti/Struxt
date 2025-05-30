import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
import { getUser } from "server/auth/user/getUser";
import { getCollection } from "server/database/mongodb";
import { loadTemplate } from "server/email/loadTemplate";
import { sendEmail } from "server/email/sendEmail";
import { getProjectData } from "../getProject";
import { getProjectInvite } from "./projectInvite";

/**
 * Send the project invite email
 *
 * @param inviteId
 */
export async function sendProjectInviteEmail(inviteId: string) {
  const collection = await getCollection<ProjectRolesInviteModel>(
    "project_members_invites"
  );

  const invite = await getProjectInvite(inviteId);
  if (!invite) {
    throw new Error("Invite not found. Could not send email.");
  }

  const project = await getProjectData(invite.projectId);
  if (!project) {
    throw new Error("Project not found. Could not send email.");
  }

  const sender = await getUser(invite.created.userId);
  if (!sender) {
    throw new Error("Sender not found. Could not send email.");
  }

  const projectUrl = new URL(
    "/dashboard",
    `https://${process.env.STRUXT_DOMAIN || "localhost"}`
  );

  // send the invite email
  const template = await loadTemplate("project-invite");
  const html = template({
    email: invite.email,
    sender_email: sender.email,
    sender_name: sender.name,
    project_name: project.name,
    project_url: projectUrl.toString(),
    custom_message: invite.message,
  });

  // send the email
  await sendEmail({
    to: invite.email,
    subject: `Invitation to join project ${project.name}`,
    html,
  });

  // update the invite to mark it as sent
  invite.emailSent = {
    ...invite.emailSent,
    active: true,
    date: Math.floor(Date.now() / 1000),
  };

  await collection.updateOne(
    {
      inviteId,
    },
    {
      $set: {
        emailSent: invite.emailSent,
      },
    }
  );

  return html;
}
