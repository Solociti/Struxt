import { useTheme } from "client/bootstrap/Theme";
import * as monaco from "monaco-editor";
import { useCallback, useEffect, useRef } from "react";
import "./codeWorker";

const createUri = (filePath: string) => {
  const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return monaco.Uri.parse(`file://${normalizedPath}`);
};

interface CodeEditorProps {
  content: string;
  filePath: string;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
}

export default function CodeEditor({
  content,
  filePath,
  onSave,
  readOnly = false,
}: CodeEditorProps) {
  const { theme } = useTheme();

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);
  const modelStates = useRef<Map<string, monaco.editor.ICodeEditorViewState>>(
    new Map()
  );

  useEffect(() => {
    monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs-light");
  }, [theme]);

  const getModel = useCallback(() => {
    const uri = createUri(filePath);
    let model = monaco.editor.getModel(uri);

    if (!model) {
      model = monaco.editor.createModel(content, undefined, uri);
    } 

    return model;
  }, [filePath, content]);

  useEffect(() => {
    if (monacoEl.current && !editorRef.current) {
      const tm = getModel();

      editorRef.current = monaco.editor.create(monacoEl.current!, {
        model: tm,
        theme: theme === "dark" ? "vs-dark" : "vs-light",
        readOnly,
      });
    }

    // We don't dispose models here to allow for switching back and forth
    // without losing undo stack / quick reload.
    // However, on full unmount of the app/page, we might want to clean up.
    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  // Update the editor when the file path changes
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const editor = editorRef.current;
    const currentModel = editor.getModel();

    // Save current view state before switching
    if (currentModel) {
      const currentUri = currentModel.uri.toString();
      const viewState = editor.saveViewState();
      if (viewState) {
        modelStates.current.set(currentUri, viewState);
      }
    }

    const model = getModel();
    const modelUri = model.uri.toString();

    // Only set model if it's different
    if (!currentModel || currentModel.uri.toString() !== modelUri) {
      editor.setModel(model);

      // Restore saved view state for this model
      const savedState = modelStates.current.get(modelUri);
      if (savedState) {
        editor.restoreViewState(savedState);
        editor.focus();
      }
    } else {
      // Same model.
      // If content prop changed and is different from model (e.g. external update), 
      // we might want to update it.
      // For now, trusting the model state as primary.
    }
  }, [filePath, getModel]);

  // listen for changes to the editor
  const _saveTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && onSave) {
      const disposable = editor.onDidChangeModelContent(() => {
        const val = editor.getValue();

        if (_saveTimeout.current) {
          clearTimeout(_saveTimeout.current);
        }

        _saveTimeout.current = setTimeout(async () => {
          _saveTimeout.current = null;

          await onSave(val);
        }, 1000);
      });

      return () => disposable.dispose();
    }
  }, [onSave, filePath]); // Re-bind if onSave changes or we swtiched files

  return (
    <div
      ref={monacoEl}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    ></div>
  );
}
