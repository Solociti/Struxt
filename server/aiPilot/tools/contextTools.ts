import { tool } from "@langchain/core/tools";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { getProjectData } from "server/api/projects/getProject";
import { saveProject } from "server/api/projects/saveProject";
import z from "zod";

export function setupContextTools(
  projectId: string,
  toolCall: (name: string, data: any) => void
) {
  const getSchema = z.object({
    key: z.string(),
  });

  const updateSchema = z.object({
    key: z.string(),
    value: z.string(),
  });

  const archiveSchema = z.object({
    key: z.string(),
  });

  const getContextKeys = async () => {
    const project = await getProjectData(projectId);
    if (!project) {
      return { success: false, value: "Project not found" };
    }

    return {
      success: true,
      value: project.context
        .filter((ctx) => !ctx.deleted.active)
        .map((ctx) => ctx.key)
        .join(", "),
    };
  };

  return {
    getContextKeys,

    tools: [
      tool(
        async () => {
          toolCall("list-project-context-keys", {});

          return await getContextKeys();
        },
        {
          name: "list-project-context-keys",
          description: "List all context keys for the current project",
          schema: z.object({}),
        }
      ),
      tool(
        async (_input) => {
          const input = _input as z.infer<typeof getSchema>;
          toolCall("get-project-context", input);

          const project = await getProjectData(projectId);
          if (!project) {
            return { success: false, value: "Project not found" };
          }

          const regex = new RegExp(input.key, "i");
          const matchedContext = project.context.filter((ctx) =>
            regex.test(ctx.key)
          );

          if (matchedContext.length === 0) {
            return { success: false, value: "No matching context found" };
          }

          return {
            success: true,
            value: matchedContext
              .map((ctx) => `${ctx.key}: ${ctx.value}`)
              .join("\n"),
          };
        },
        {
          name: "get-project-context",
          description: "Get the project context by key using regexp",
          schema: getSchema,
        }
      ),
      tool(
        async (_input) => {
          const input = _input as z.infer<typeof updateSchema>;
          toolCall("update-project-context", input);

          const project = await getProjectData(projectId);
          if (!project) {
            return { success: false, message: "Project not found" };
          }

          const existingIndex = project.context.findIndex(
            (ctx) => ctx.key === input.key
          );
          if (existingIndex !== -1) {
            // Update existing key
            const ctx = project.context[existingIndex];

            ctx.value = input.value;
            ctx.updated = {
              date: Math.floor(Date.now() / 1000),
              userId: "",
              displayName: "AI Agent",
            };
          } else {
            // Add new key-value pair
            project.context.push(
              ProjectModel.createContextItem({
                key: input.key,
                value: input.value,
              })
            );
          }

          await saveProject(project);

          return { success: true, message: "Context updated successfully" };
        },
        {
          name: "update-project-context",
          description:
            "Update or add a new key-value pair to the project context. Save any context that might be useful for future conversations. (style, tone, audience, about, etc.)",
          schema: updateSchema,
        }
      ),
      tool(
        async (_input) => {
          const input = _input as z.infer<typeof archiveSchema>;
          toolCall("archive-project-context", input);

          const project = await getProjectData(projectId);
          if (!project) {
            return { success: false, message: "Project not found" };
          }

          const existingIndex = project.context.findIndex(
            (ctx) => ctx.key === input.key
          );
          if (existingIndex !== -1) {
            // Update existing key
            const ctx = project.context[existingIndex];

            ctx.updated = {
              date: Math.floor(Date.now() / 1000),
              userId: "",
              displayName: "AI Agent",
            };
            ctx.deleted = {
              ...ctx.deleted,
              ...ctx.updated,
              active: true,
            };

            await saveProject(project);
          }

          return { success: true, message: "Context archived successfully" };
        },
        {
          name: "archive-project-context",
          description: "Archive a key-value pair from the project context.",
          schema: updateSchema,
        }
      ),
    ],
  };
}
