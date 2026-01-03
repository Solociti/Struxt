import CodeMirror, { ViewUpdate } from "@uiw/react-codemirror";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { useCallback, useEffect, useState } from "react";
import { RoutineModel } from "common/models/routines/Routine";
import { useTheme } from "client/bootstrap/Theme";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";

function myCompletions(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  return {
    from: word.from,
    options: [
      { label: "match", type: "keyword" },
      { label: "hello", type: "variable", info: "(World)" },
      { label: "magic", type: "text", apply: "⠁⭒*.✩.*⭒⠁", detail: "macro" },
      {
        label: "importScript",
        type: "function",
        apply: "importScript",
        detail: "(path: string)",
      },
    ],
  };
}

export function CodeEditor({ routine }: { routine: RoutineModel }) {
  const [value, setValue] = useState(routine.contents);

  useEffect(() => {
    setValue(routine.contents);
  }, [routine]);

  const onChange = useCallback((val: string, viewUpdate: ViewUpdate) => {
    console.log("val:", val);
    setValue(val);
  }, []);

  const { theme } = useTheme();

  return (
    <div className="h-100 flex-grow-1" style={{ overflowY: "auto" }}>
      <CodeMirror
        value={value}
        extensions={[
          javascript({ jsx: false, typescript: true }),
          autocompletion(),
          javascriptLanguage.data.of({ autocomplete: myCompletions }),
        ]}
        onChange={onChange}
        theme={theme}
      />
    </div>
  );
}
