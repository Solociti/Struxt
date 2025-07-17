import { html } from "@codemirror/lang-html";
import { githubDarkInit, githubLightInit } from "@uiw/codemirror-theme-github";
import CodeMirror from "@uiw/react-codemirror";
import { useTheme } from "client/bootstrap/Theme";
import { useCodeRealChange } from "./useCodeRealChange";

interface HtmlEditorProps {
  value: string;
  onRealChange: (value: string) => void;

  height?: string;
}

export default function HtmlEditor({
  value,
  onRealChange,
  height,
}: HtmlEditorProps) {
  const { theme } = useTheme();
  const changeProps = useCodeRealChange(value, onRealChange, {});

  return (
    <CodeMirror
      height={height || "300px"}
      extensions={[
        html({
          autoCloseTags: true,
        }),
      ]}
      theme={
        theme === "dark"
          ? githubDarkInit({
              settings: {
                background: "rgba(0, 0, 0, 0.2)",
              },
            })
          : githubLightInit({
              settings: {
                background: "rgba(0, 0, 0, 0.05)",
              },
            })
      }
      {...changeProps}
    />
  );
}
