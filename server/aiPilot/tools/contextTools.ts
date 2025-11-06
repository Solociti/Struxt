import { tool } from "@langchain/core/tools";
import { AiPilotPrompts } from "common/models/aiPilot/tools/AiPilotPrompts";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { getProjectData } from "server/api/projects/getProject";
import { saveProject } from "server/api/projects/saveProject";
import z from "zod";
import { tools } from "../metrics";

export function setupMemoryTools(
  projectId: string,
  descriptions: AiPilotPrompts,
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
    type: z
      .enum(["facts", "preferences", "decisions", "context", "style"])
      .optional(),
  });

  const getByTypeSchema = z.object({
    type: z.enum(["facts", "preferences", "decisions", "context", "style"]),
  });

  const archiveSchema = z.object({
    key: z.string(),
  });

  const setupTool = (
    name: string,
    description: string,
    schema: any,
    callback: Function
  ) => {
    return tool(
      async (
        input: z.infer<
          | typeof getSchema
          | typeof updateSchema
          | typeof searchSchema
          | typeof getByTypeSchema
          | typeof archiveSchema
        >
      ) => {
        const startTime = Date.now();

        try {
          // Record tool call
          toolCall(name, input);
          const memoryType = String(
            ("type" in input && input.type) || "undefined"
          );
          tools.recordMemoryOperation(name, memoryType, projectId);

          const result = await callback(input);

          // Record successful tool execution
          const duration = (Date.now() - startTime) / 1000;
          tools.recordExecution(name, projectId, duration);

          return result;
        } catch (error) {
          // Record tool error
          const errorType =
            error instanceof Error ? error.constructor.name : "UnknownError";
          tools.recordError(name, errorType, projectId);

          // Record execution time even for failed tools
          const duration = (Date.now() - startTime) / 1000;
          tools.recordExecution(name, projectId, duration);

          throw error;
        }
      },
      {
        name,
        description,
        schema,
      }
    );
  };

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

  const getProjectMemory = async (input: z.infer<typeof getSchema>) => {
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
      value: matchedContext.map((ctx) => `${ctx.key}: ${ctx.value}`).join("\n"),
    };
  };

  const searchProjectMemories = async (input: z.infer<typeof searchSchema>) => {
    const project = await getProjectData(projectId);
    if (!project) {
      return { success: false, value: "Project not found" };
    }

    let matchedContext = project.context.filter((ctx) => !ctx.deleted.active);

    // Filter by type if specified
    if (input.type) {
      matchedContext = matchedContext.filter((ctx) => {
        // Check if the context has a type field or if the key contains type information
        return (
          ctx.key.toLowerCase().includes(input.type!) ||
          (ctx.value && ctx.value.toLowerCase().includes(input.type!))
        );
      });
    }

    // Filter by query if specified
    if (input.query) {
      const regex = new RegExp(input.query, "i");
      matchedContext = matchedContext.filter(
        (ctx) => regex.test(ctx.key) || regex.test(ctx.value)
      );
    }

    if (matchedContext.length === 0) {
      return { success: false, value: "No matching memories found" };
    }

    return {
      success: true,
      value: matchedContext.map((ctx) => `${ctx.key}: ${ctx.value}`).join("\n"),
    };
  };

  const getMemoriesByType = async (input: z.infer<typeof getByTypeSchema>) => {
    const project = await getProjectData(projectId);
    if (!project) {
      return { success: false, value: "Project not found" };
    }

    const matchedContext = project.context.filter(
      (ctx) =>
        !ctx.deleted.active &&
        (ctx.key.toLowerCase().includes(input.type) ||
          (ctx.value && ctx.value.toLowerCase().includes(input.type)))
    );

    if (matchedContext.length === 0) {
      return { success: false, value: `No ${input.type} memories found` };
    }

    return {
      success: true,
      value: matchedContext.map((ctx) => `${ctx.key}: ${ctx.value}`).join("\n"),
    };
  };

  const saveProjectMemory = async (input: z.infer<typeof updateSchema>) => {
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
  };

  const archiveProjectMemory = async (input: z.infer<typeof archiveSchema>) => {
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
  };

  return {
    getMemoryKeys,

    tools: [
      setupTool(
        "list-project-memories",
        descriptions.getTool("list-project-memories"),
        z.object({}),
        () => getMemoryKeys()
      ),
      setupTool(
        "get-project-memory",
        descriptions.getTool("get-project-memory"),
        getSchema,
        getProjectMemory
      ),
      setupTool(
        "search-project-memories",
        descriptions.getTool("search-project-memories"),
        searchSchema,
        searchProjectMemories
      ),
      setupTool(
        "get-memories-by-type",
        descriptions.getTool("get-memories-by-type"),
        getByTypeSchema,
        getMemoriesByType
      ),
      setupTool(
        "save-project-memory",
        descriptions.getTool("save-project-memory"),
        updateSchema,
        saveProjectMemory
      ),
      setupTool(
        "archive-project-memory",
        descriptions.getTool("archive-project-memory"),
        archiveSchema,
        archiveProjectMemory
      ),
    ],
  };
}
