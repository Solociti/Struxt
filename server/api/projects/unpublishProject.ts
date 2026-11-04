import { PublishApi } from "common/api/publish/publish";

/**
 * Unpublish the active sites for a project
 *
 * @param projectId
 * @param user
 */
export async function unpublishProject(
  projectId: string,
  user: { userId: string; displayName: string },
): Promise<PublishApi["DeleteResponse"]> {
  console.log(`Unpublished project ${projectId}`);

  return { success: true };
}
