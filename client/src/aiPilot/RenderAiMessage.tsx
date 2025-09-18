import { useTheme } from "client/bootstrap/Theme";
import { toolNames } from "common/api/aiPilot/toolNames";
import { AiChatMessage } from "common/models/aiPilot/ChatMessage";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import "./aiPilotStyles.css";

interface RenderAiMessageProps {
  message: AiChatMessage;
}

/**
 * Render the given AI message
 *
 * @param param0
 * @returns
 */
export function RenderAiMessage({ message }: RenderAiMessageProps) {
  const content = message.getMergedContent();
  const { theme } = useTheme();

  return (
    <div className="m-1 my-3">
      {content.map((m, i: number) => {
        if (m.category === "tool_response") {
          return null;
        }

        if (m.category === "tool_call") {
          const tool = toolNames[m.content as keyof typeof toolNames];
          if (!tool || !tool.displayName) {
            return null;
          }

          return (
            <div
              key={i}
              className="d-inline-block border rounded p-1 m-1 text-nowrap text-truncate"
              style={{ backgroundColor: "rgba(92, 246, 151, 0.2)" }}
            >
              {tool.displayName}
            </div>
          );
        }

        if (m.category === "message") {
          return (
            <div key={i} className="ai-pilot-md-message">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");

                    return !inline && match ? (
                      <SyntaxHighlighter
                        children={String(children).replace(/\n$/, "")}
                        style={
                          theme === "dark"
                            ? (oneDark as any)
                            : (oneLight as any)
                        }
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {m.content}
              </ReactMarkdown>
            </div>
          );
        }

        return (
          <div key={i} className="p-1 text-muted border rounded mb-1">
            {m.category} - {m.content}
          </div>
        );
      })}
    </div>
  );
}
