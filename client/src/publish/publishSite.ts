import { postApi } from "client/api/api";
import { addToastError } from "client/components/ErrorSnackBar";
import { showToastTop } from "client/components/ToastTop";
import { PublishApi } from "common/api/publish/publish";
import { Editor } from "grapesjs";

export async function publishSite(
  editor: Editor,
  projectId: string,
  type: "staging" | "production"
): Promise<PublishApi["PostResponse"] | null> {
  try {
    const files = await editor.runCommand("studio:projectFiles", {
      skipProject: true,
    });

    const body: PublishApi["PostBody"] = {
      projectId,
      type,
      files,
    };

    const result = await postApi<PublishApi>(["/api/publish", projectId], body);

    if (result.success) {
      showToastTop(`Published ${type}.`, "check", "success", 2500);
    }

    return result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      addToastError(error);
    } else {
      addToastError(new Error("Unknown error occurred while publishing site"));
    }
  }
  return null;
}
