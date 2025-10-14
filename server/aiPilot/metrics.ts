import * as client from "prom-client";

// TODO: remove any metrics that are not being used

/**
 * Model usage metrics
 */

/**
 * Tracks how frequently each AI model is used across projects.
 *
 * Why: Essential for understanding model adoption, cost allocation, and capacity planning.
 * Helps identify which models are most popular and may need scaling or cost optimization.
 *
 * What: Counts every request made to an AI model, labeled by model, vendor, and project.
 */
export const modelRequestsCounter = new client.Counter({
  name: "ai_pilot_model_requests_total",
  help: "Total number of requests made to each AI model",
  labelNames: ["model_id", "vendor", "project_id"],
});

/**
 * Measures token consumption patterns across different models and token types.
 *
 * Why: Token usage directly correlates to API costs and response quality. Different models
 * have different token efficiency patterns. This helps optimize cost vs. performance.
 *
 * What: Histogram of token counts (prompt, completion, total) to understand distribution
 * patterns. Buckets chosen based on typical AI response sizes (10 tokens for simple responses
 * up to 50k for complex code generation).
 */
export const modelTokensHistogram = new client.Histogram({
  name: "ai_pilot_model_tokens_used",
  help: "Histogram of tokens used by AI models",
  labelNames: ["model_id", "vendor", "token_type"],
  buckets: [10, 50, 100, 500, 1000, 2000, 5000, 10000, 20000, 50000],
});

/**
 * Tracks the total token usage across all models for comprehensive usage monitoring.
 *
 * Why: Provides a simple aggregate view of total token consumption across all models
 * and projects. Essential for overall usage tracking and capacity planning.
 *
 * What: Counts total tokens used by model, vendor, and project. Used alongside
 * the histogram for both aggregate reporting and detailed distribution analysis.
 */
export const modelTokenCounter = new client.Counter({
  name: "ai_pilot_model_token_total",
  help: "Total tokens used by AI models",
  labelNames: ["model_id", "vendor", "project_id"],
});

/**
 * Tracks the actual cost impact of token usage accounting for model pricing tiers.
 *
 * Why: Different models have different cost structures (tokenMultiplier). This metric
 * provides accurate cost attribution for billing and budget management separately
 * from raw token usage tracking.
 *
 * What: Counts consumed tokens (total * tokenMultiplier) to reflect actual cost impact
 * rather than raw token usage. Critical for accurate project cost allocation and billing.
 */
export const modelTokenCostCounter = new client.Counter({
  name: "ai_pilot_model_token_cost_total",
  help: "Total consumed tokens (accounting for model multiplier)",
  labelNames: ["model_id", "vendor", "project_id"],
});

/**
 * Response time metrics
 */

/**
 * Measures end-to-end AI response latency for performance monitoring and SLA compliance.
 *
 * Why: Response time directly impacts user experience. Different models have vastly different
 * performance characteristics. This helps identify performance bottlenecks and set realistic
 * user expectations.
 *
 * What: Histogram of complete response times from request initiation to final response.
 * Buckets range from 0.1s (fast responses) to 120s (complex generation tasks).
 * Used for performance alerting and capacity planning.
 */
export const responseDurationHistogram = new client.Histogram({
  name: "ai_pilot_response_duration_seconds",
  help: "Duration of AI model responses",
  labelNames: ["model_id", "vendor", "project_id"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
});

/**
 * Tracks streaming response latency to monitor real-time user experience.
 *
 * Why: Streaming responses provide immediate user feedback. Chunk timing affects perceived
 * responsiveness and helps identify network or processing bottlenecks in the streaming pipeline.
 *
 * What: Time between individual stream chunks during AI response generation.
 * Smaller buckets (0.01-5s) to capture fine-grained streaming performance.
 * Critical for maintaining smooth real-time chat experience.
 */
export const streamChunkDurationHistogram = new client.Histogram({
  name: "ai_pilot_stream_chunk_duration_seconds",
  help: "Duration between stream chunks",
  labelNames: ["model_id", "chunk_type"],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

/**
 * Tool execution metrics
 */

/**
 * Tracks frequency of AI agent tool usage to understand feature adoption and workflow patterns.
 *
 * Why: Tools are the primary way AI agents interact with the website builder. Understanding
 * which tools are used most helps prioritize tool development and identify popular workflows.
 * Essential for product development and user behavior analysis.
 *
 * What: Counts every tool invocation by AI agents, segmented by tool type, project, and model.
 * Includes both client tools (page manipulation) and memory tools (context management).
 */
export const toolCallsCounter = new client.Counter({
  name: "ai_pilot_tool_calls_total",
  help: "Total number of tool calls made by AI agents",
  labelNames: ["tool_name", "type", "project_id", "model_id"],
});

/**
 * Measures tool execution performance to identify slow operations and optimize workflows.
 *
 * Why: Slow tool execution directly impacts AI response time and user experience.
 * Different tools have vastly different complexity (memory lookup vs. page rendering).
 * This helps identify performance bottlenecks in the tool chain.
 *
 * What: Histogram of tool execution times to understand performance distribution.
 * Buckets optimized for typical tool operations (0.01s for simple operations up to 10s for complex ones).
 */
export const toolExecutionDurationHistogram = new client.Histogram({
  name: "ai_pilot_tool_execution_duration_seconds",
  help: "Duration of tool executions",
  labelNames: ["tool_name", "project_id"],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10],
});

/**
 * Tracks tool execution failures to identify reliability issues and improve error handling.
 *
 * Why: Tool failures break AI workflows and degrade user experience. Understanding
 * failure patterns helps prioritize bug fixes and improve tool reliability.
 * Critical for maintaining system stability and user trust.
 *
 * What: Counts tool execution errors by tool type and error category.
 * Used for error rate monitoring and reliability alerting.
 */
export const toolErrorsCounter = new client.Counter({
  name: "ai_pilot_tool_errors_total",
  help: "Total number of tool execution errors",
  labelNames: ["tool_name", "error_type", "project_id"],
});

/**
 * Chat session metrics
 */

/**
 * Tracks new chat session creation to measure AI Pilot adoption and usage growth.
 *
 * Why: Chat sessions represent user engagement with AI Pilot. Growth in sessions
 * indicates successful product adoption. Per-project tracking helps identify
 * which projects benefit most from AI assistance.
 *
 * What: Counts every new chat session started, segmented by project.
 * Used for growth metrics and project-level usage analytics.
 */
export const chatSessionsCounter = new client.Counter({
  name: "ai_pilot_chat_sessions_total",
  help: "Total number of chat sessions started",
  labelNames: ["project_id"],
});

/**
 * Measures chat activity volume to understand conversation patterns and system load.
 *
 * Why: Message volume indicates engagement depth and helps predict resource needs.
 * Distinguishing user vs AI messages helps understand conversation dynamics and
 * response ratios. Critical for capacity planning and user engagement analysis.
 *
 * What: Counts all messages (user and AI) sent in chat sessions.
 * Used for engagement metrics and system load forecasting.
 */
export const messagesCounter = new client.Counter({
  name: "ai_pilot_messages_total",
  help: "Total number of messages sent",
  labelNames: ["message_type", "project_id"],
});

/**
 * Monitors current active chat sessions for real-time load balancing and resource allocation.
 *
 * Why: Active sessions consume server resources (memory, database connections, WebSocket connections).
 * Real-time monitoring helps with auto-scaling and resource management.
 * Critical for maintaining system performance under varying load.
 *
 * What: Current count of active WebSocket connections for AI Pilot chats.
 * Used for real-time resource monitoring and scaling decisions.
 */
export const activeSessionsGauge = new client.Gauge({
  name: "ai_pilot_active_sessions",
  help: "Number of currently active chat sessions",
  labelNames: ["project_id"],
});

/**
 * Memory tool metrics
 */

/**
 * Tracks usage of the AI memory system to understand how agents utilize project context.
 *
 * Why: The memory system is critical for maintaining context across conversations.
 * Understanding which memory operations are used most helps optimize the context system
 * and identifies how AI agents learn and retain project information.
 *
 * What: Counts memory operations (get, update, search, archive) by memory type
 * (facts, preferences, decisions, context, style). Essential for understanding
 * AI learning patterns and context utilization.
 */
export const memoryOperationsCounter = new client.Counter({
  name: "ai_pilot_memory_operations_total",
  help: "Total number of memory tool operations",
  labelNames: ["operation", "memory_type", "project_id"],
});

/**
 * Client tool metrics
 */

/**
 * Error and performance metrics
 */

/**
 * Tracks system errors across the AI Pilot system for reliability monitoring and debugging.
 *
 * Why: Error tracking is essential for maintaining system reliability and user trust.
 * Different error types (network, API, validation, etc.) require different solutions.
 * Model-specific error rates help identify problematic AI providers or configurations.
 *
 * What: Counts all errors by type, model, and project for comprehensive error analysis.
 * Used for alerting, debugging, and reliability improvements.
 */
export const errorsCounter = new client.Counter({
  name: "ai_pilot_errors_total",
  help: "Total number of errors encountered",
  labelNames: ["error_type", "model_id", "project_id"],
});

/**
 * Analyzes message size patterns to optimize performance and understand usage characteristics.
 *
 * Why: Message length affects processing time, token usage, and user experience.
 * Very long messages may indicate complex requests or potential abuse.
 * Understanding size distribution helps optimize message handling and set appropriate limits.
 *
 * What: Histogram of message character counts for both user and AI messages.
 * Buckets chosen to identify different message types (short queries vs. long explanations).
 * Used for performance optimization and usage pattern analysis.
 */
export const messageLengthHistogram = new client.Histogram({
  name: "ai_pilot_message_length_characters",
  help: "Length of messages in characters",
  labelNames: ["message_type", "project_id"],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
});

/**
 * User activity metrics
 */

/**
 * Tracks unique user engagement with AI Pilot for adoption and growth analysis.
 *
 * Why: Understanding how many unique users engage with AI Pilot helps measure
 * product adoption and success. Per-project tracking identifies which projects
 * benefit most from AI assistance and helps guide feature development priorities.
 *
 * What: Counts unique users who interact with AI Pilot per project.
 * Used for growth metrics, adoption analysis, and user engagement tracking.
 */
export const activeUsersCounter = new client.Counter({
  name: "ai_pilot_users_active_total",
  help: "Total number of unique users using AI Pilot",
  labelNames: ["project_id"],
});

/**
 * Measures user engagement depth through session duration analysis.
 *
 * Why: Session duration indicates user engagement quality and satisfaction.
 * Very short sessions might indicate usability issues, while very long sessions
 * might indicate high value or potential performance problems. Understanding
 * duration patterns helps optimize user experience and identify engagement issues.
 *
 * What: Histogram of chat session durations to understand engagement patterns.
 * Buckets range from 1 minute (quick interactions) to 4 hours (deep work sessions).
 * Used for engagement analysis and user experience optimization.
 */
export const sessionDurationHistogram = new client.Histogram({
  name: "ai_pilot_session_duration_seconds",
  help: "Duration of chat sessions",
  labelNames: ["project_id"],
  buckets: [60, 300, 600, 1200, 1800, 3600, 7200, 14400],
});

/**
 * Utility functions for recording metrics organized by category
 */

/**
 * Model-related metrics recording functions
 */
export const model = {
  /**
   * count a new llm message request
   */
  countRequest(modelId: string, vendor: string, projectId: string) {
    modelRequestsCounter.inc({
      model_id: modelId,
      vendor,
      project_id: projectId,
    });
  },

  /**
   * Record token usage for a model
   *
   * These values are recorded at the chunk level when streaming.
   */
  recordTokenUsage(
    modelId: string,
    vendor: string,
    tokens: {
      prompt: number;
      completion: number;
      total: number;
      consumed: number;
    },
    projectId: string
  ) {
    // Record raw token usage (before multiplier) for accurate token consumption tracking
    modelTokensHistogram.observe(
      { model_id: modelId, vendor, token_type: "prompt" },
      tokens.prompt
    );
    modelTokensHistogram.observe(
      { model_id: modelId, vendor, token_type: "completion" },
      tokens.completion
    );
    modelTokensHistogram.observe(
      { model_id: modelId, vendor, token_type: "total" },
      tokens.total
    );

    // Record raw token totals (before multiplier) for aggregate usage tracking
    modelTokenCounter.inc(
      { model_id: modelId, vendor, project_id: projectId },
      tokens.total
    );

    // Record cost-adjusted tokens (after multiplier) for billing and cost allocation
    modelTokenCostCounter.inc(
      { model_id: modelId, vendor, project_id: projectId },
      tokens.consumed
    );

    // TODO: Add token usage to redis as a cache for quick retrieval.
    // TODO: Add periodic job to update the redis cache from Prometheus data. (e.g., every 10 minutes)
    // TODO: or alternatively, have a mongodb collection that logs daily token usage per chat per project.
  },

  /**
   * Record response duration for a model
   */
  recordResponseDuration(
    modelId: string,
    vendor: string,
    projectId: string,
    durationSec: number
  ) {
    responseDurationHistogram.observe(
      { model_id: modelId, vendor, project_id: projectId },
      durationSec
    );
  },
};

/**
 * Tool-related metrics recording functions
 */
export const tools = {
  /**
   * Record a tool call
   */
  recordCall(
    type: "client" | "server",
    toolName: string,
    projectId: string,
    modelId: string
  ) {
    toolCallsCounter.inc({
      type,
      tool_name: toolName,
      project_id: projectId,
      model_id: modelId,
    });
  },

  /**
   * Record tool execution duration
   */
  recordExecution(toolName: string, projectId: string, durationSec: number) {
    toolExecutionDurationHistogram.observe(
      { tool_name: toolName, project_id: projectId },
      durationSec
    );
  },

  /**
   * Record a tool error
   */
  recordError(toolName: string, errorType: string, projectId: string) {
    toolErrorsCounter.inc({
      tool_name: toolName,
      error_type: errorType,
      project_id: projectId,
    });
  },

  /**
   * Record a memory operation
   */
  recordMemoryOperation(
    operation: string,
    memoryType: string,
    projectId: string
  ) {
    memoryOperationsCounter.inc({
      operation,
      memory_type: memoryType,
      project_id: projectId,
    });

    toolCallsCounter.inc({
      type: "server",
      tool_name: operation,
      project_id: projectId,
      model_id: "unknown",
    });
  },
};

/**
 * Session-related metrics recording functions
 */
export const sessions = {
  /**
   * Record a new chat session
   */
  recordChat(projectId: string) {
    chatSessionsCounter.inc({ project_id: projectId });
  },

  /**
   * Record session duration
   */
  recordDuration(projectId: string, duration: number) {
    sessionDurationHistogram.observe({ project_id: projectId }, duration);
  },

  /**
   * Update active sessions count
   */
  updateActiveCount(projectId: string, count: number) {
    activeSessionsGauge.set({ project_id: projectId }, count);
  },
};

/**
 * Message-related metrics recording functions
 */
export const messages = {
  /**
   * Record a message (user or AI)
   */
  record(messageType: "user" | "ai", projectId: string, length?: number) {
    messagesCounter.inc({ message_type: messageType, project_id: projectId });
    if (length !== undefined) {
      messageLengthHistogram.observe(
        { message_type: messageType, project_id: projectId },
        length
      );
    }
  },
};

/**
 * User-related metrics recording functions
 */
export const users = {
  /**
   * Record an active user
   */
  recordActive(projectId: string) {
    activeUsersCounter.inc({ project_id: projectId });
  },
};

/**
 * Error-related metrics recording functions
 */
export const errors = {
  /**
   * Record a system error
   */
  record(errorType: string, modelId: string, projectId: string) {
    errorsCounter.inc({
      error_type: errorType,
      model_id: modelId,
      project_id: projectId,
    });
  },
};
