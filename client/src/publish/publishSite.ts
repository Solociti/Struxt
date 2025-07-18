import { postApi } from "client/api/api";
import { addToastError } from "client/components/ErrorSnackBar";
import { showToastTop } from "client/components/ToastTop";
import { Editor } from "grapesjs";

export async function publishSite(
  editor: Editor,
  projectId: string,
  type: "staging" | "production"
) {
  try {
    const files = await editor.runCommand("studio:projectFiles", {
      skipProject: true,
    });

    const body = {
      projectId,
      type,
      files,
    };

    const result = await postApi(["/api/publish", projectId], body);

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
}
