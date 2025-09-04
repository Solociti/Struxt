import { useTheme } from "client/bootstrap/Theme";
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
        if (m.category === "tool_call") {
          return (
            <div className="p-2 text-muted text-nowrap text-truncate" key={i}>
              <strong>Tool Call:</strong> {m.content}
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
