import { tool } from "@langchain/core/tools";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { getProjectData } from "server/api/projects/getProject";
import { saveProject } from "server/api/projects/saveProject";
import z from "zod";

export function setupMemoryTools(
  projectId: string,
  toolCall: (name: string, data: any) => void
) {
  const getSchema = z.object({
    key: z.string(),
  });

  const updateSchema = z.object({
    key: z.string(),
    value: z.string(),
    type: z
      .enum(["facts", "preferences", "decisions", "context", "style"])
      .optional(),
  });

  const searchSchema = z.object({
    query: z.string().optional(),
    type: z.enum(["facts", "preferences", "decisions", "context", "style"]).optional(),
  });

  const getByTypeSchema = z.object({
    type: z.enum(["facts", "preferences", "decisions", "context", "style"]),
  });

  const archiveSchema = z.object({
    key: z.string(),
  });

  const getMemoryKeys = async () => {
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
    getMemoryKeys,

    tools: [
      tool(
        async () => {
          toolCall("list-project-memories", {});

          return await getMemoryKeys();
        },
        {
          name: "list-project-memories",
          description:
            "List all memory keys stored for the current project. Use this to see what information has been saved about the project.",
          schema: z.object({}),
        }
      ),
      tool(
        async (_input) => {
          const input = _input as z.infer<typeof getSchema>;
          toolCall("get-project-memory", input);

          const project = await getProjectData(projectId);
          if (!project) {
            return { success: false, value: "Project not found" };
          }

          const regex = new RegExp(input.key, "i");
          const matchedContext = project.context.filter(
            (ctx) => !ctx.deleted.active && regex.test(ctx.key)
          );

          if (matchedContext.length === 0) {
            return { success: false, value: "No matching memories found" };
          }

          return {
            success: true,
            value: matchedContext
              .map((ctx) => `${ctx.key}: ${ctx.value}`)
              .join("\n"),
          };
        },
        {
          name: "get-project-memory",
          description:
            "Get project memories by key using regexp. Use this to recall specific information about the project.",
          schema: getSchema,
        }
      ),
      tool(
        async (_input) => {
          const input = _input as z.infer<typeof searchSchema>;
          toolCall("search-project-memories", input);

          const project = await getProjectData(projectId);
          if (!project) {
            return { success: false, value: "Project not found" };
          }

          let matchedContext = project.context.filter((ctx) => !ctx.deleted.active);

          // Filter by type if specified
          if (input.type) {
            matchedContext = matchedContext.filter((ctx) => {
              // Check if the context has a type field or if the key contains type information
              return ctx.key.toLowerCase().includes(input.type!) || 
                     (ctx.value && ctx.value.toLowerCase().includes(input.type!));
            });
          }

          // Filter by query if specified
          if (input.query) {
            const regex = new RegExp(input.query, "i");
            matchedContext = matchedContext.filter((ctx) =>
              regex.test(ctx.key) || regex.test(ctx.value)
            );
          }

          if (matchedContext.length === 0) {
            return { success: false, value: "No matching memories found" };
          }

          return {
            success: true,
            value: matchedContext
              .map((ctx) => `${ctx.key}: ${ctx.value}`)
              .join("\n"),
          };
        },
        {
          name: "search-project-memories",
          description:
            "Search project memories by content and/or type. Use query to search in keys/values, use type to filter by memory category (facts, preferences, decisions, context, style).",
          schema: searchSchema,
        }
      ),
      tool(
        async (_input) => {
          const input = _input as z.infer<typeof getByTypeSchema>;
          toolCall("get-memories-by-type", input);

          const project = await getProjectData(projectId);
          if (!project) {
            return { success: false, value: "Project not found" };
          }

          const matchedContext = project.context.filter((ctx) => 
            !ctx.deleted.active && 
            (ctx.key.toLowerCase().includes(input.type) || 
             (ctx.value && ctx.value.toLowerCase().includes(input.type)))
          );

          if (matchedContext.length === 0) {
            return { success: false, value: `No ${input.type} memories found` };
          }

          return {
            success: true,
            value: matchedContext
              .map((ctx) => `${ctx.key}: ${ctx.value}`)
              .join("\n"),
          };
        },
        {
          name: "get-memories-by-type",
          description:
            "Get all project memories of a specific type (facts, preferences, decisions, context, style). Use this to recall specific categories of information.",
          schema: getByTypeSchema,
        }
      ),
      tool(
        async (_input) => {
          const input = _input as z.infer<typeof updateSchema>;
          toolCall("save-project-memory", input);

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

          return { success: true, message: "Memory saved successfully" };
        },
        {
          name: "save-project-memory",
          description:
            "Save important information about the project for future reference. Always use this when you learn something important about the project: style preferences, brand voice, target audience, technical requirements, design decisions, user feedback, etc. This helps maintain continuity across conversations.",
          schema: updateSchema,
        }
      ),
      tool(
        async (_input) => {
          const input = _input as z.infer<typeof archiveSchema>;
          toolCall("archive-project-memory", input);

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

          return { success: true, message: "Memory archived successfully" };
        },
        {
          name: "archive-project-memory",
          description:
            "Archive a memory entry when it's no longer relevant or accurate.",
          schema: archiveSchema,
        }
      ),
    ],
  };
}
