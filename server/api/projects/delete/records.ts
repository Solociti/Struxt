import { TokenTransactions } from "common/models/aiPilot/TokenTransactions";
import { TokenWallet } from "common/models/aiPilot/TokenWallet";
import { AssetModel } from "common/models/assets/AssetModel";
import { EditorSnapshotModel } from "common/models/projects/EditorSnapshot";
import { FormSettingsModel } from "common/models/projects/forms/FormSettingsModel";
import { FormSubmissionModel } from "common/models/projects/forms/FormSubmissionModel";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { ProjectRoleDocument } from "common/models/projects/ProjectRoles";
import { ProjectRolesInviteModel } from "common/models/projects/ProjectRolesInviteModel";
import { PublishModel } from "common/models/projects/PublishModel";
import { CollectionNames, getCollection } from "server/database/mongodb";

/**
 * Delete all project records from the database
 *
 * @param projectId
 * @param log
 */
export async function deleteProjectRecords(
  projectId: string,
  log: (msg: string) => void,
) {
  await deleteRecords<EditorSnapshotModel>(
    "editor_snapshots",
    { projectId },
    log,
  );
  await deleteRecords<ProjectRoleDocument>(
    "project_members",
    { projectId },
    log,
  );
  await deleteRecords<ProjectRolesInviteModel>(
    "project_members_invites",
    { projectId },
    log,
  );
  await deleteRecords<FormSettingsModel>("form_settings", { projectId }, log);
  await deleteRecords<FormSubmissionModel>(
    "form_submissions",
    { projectId },
    log,
  );
  await deleteRecords<TokenTransactions>(
    "ai_pilot_token_transactions",
    { projectId },
    log,
  );
  await deleteRecords<TokenWallet>("ai_pilot_token_wallet", { projectId }, log);
  await deleteRecords<AssetModel>("assets", { projectId }, log);
  await deleteRecords<PublishModel>("projects_published", { projectId }, log);
  await deleteRecords<ProjectModel>("projects", { projectId }, log);
}

/**
 * Delete records from a collection for a project
 *
 * @param collectionName
 * @param filter
 * @param log
 * @returns
 */
async function deleteRecords<M extends { projectId: string }>(
  collectionName: CollectionNames,
  filter: Pick<M, "projectId">,
  log: (msg: string) => void,
) {
  const collection = await getCollection<{ projectId: string }>(collectionName);
  const result = await collection.deleteMany(filter);

  log(`Collection: ${collectionName} Deleted: ${result.deletedCount}`);
  return result;
}
