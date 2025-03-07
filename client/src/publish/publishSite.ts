import { Editor } from "grapesjs";

export async function publishSite(
  editor: Editor,
  projectId: string,
  type: "staging" | "production"
) {
  const files = await editor.runCommand("studio:projectFiles", {
    skipProject: true,
  });

  const body = {
    projectId,
    type,
    files,
  };

  const response = await fetch("/api/publish/" + projectId, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const result = await response.json();
  return result;
}
