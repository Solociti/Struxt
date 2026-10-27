import { useTheme } from "client/bootstrap/Theme";
import * as monaco from "monaco-editor";
import { useEffect, useRef } from "react";
import "./codeWorker";

const createUri = (filePath: string) => {
  const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return monaco.Uri.parse(`file://${normalizedPath}`);
};

interface CodeEditorProps {
  filePath: string;
  content: monaco.editor.ITextModel;

  onChange?: (content: string) => void;
  /**
   * Should be a useCallback hook to prevent unnecessary re-renders
   *
   * @param content
   * @returns
   */
  onSave?: (content: string) => Promise<void>;

  readOnly?: boolean;
}

/**
 * Update/Create a model for the monaco editor
 *
 * @param filePath
 * @param content
 * @returns
 */
export function updateEditorModel(filePath: string, content: string) {
  const tm = monaco.editor.getModel(createUri(filePath));
  if (tm) {
    tm.setValue(content);
    return tm;
  } else {
    return monaco.editor.createModel(content, undefined, createUri(filePath));
  }
}

/**
 * The Monaco CodeEditor component
 *
 * @param param0
 * @param ref
 * @returns
 */
export default function CodeEditor({
  filePath,
  content,
  onChange,
  onSave,
  readOnly = false,
}: CodeEditorProps) {
  const { theme } = useTheme();

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);
  const modelStates = useRef<Map<string, monaco.editor.ICodeEditorViewState>>(
    new Map(),
  );

  useEffect(() => {
    monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs-light");
  }, [theme]);

  useEffect(() => {
    // don't setup the editor if we don't have a model
    if (!content || !filePath) {
      return;
    }

    // setup the editor
    if (monacoEl.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(monacoEl.current!, {
        model: content,
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

  // Update the loaded editor model when the file path changes
  useEffect(() => {
    if (!editorRef.current || !content || !filePath) {
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

    const modelUri = content.uri.toString();

    // Only swap the model if it's different
    if (!currentModel || currentModel.uri.toString() !== modelUri) {
      editor.setModel(content);

      // Restore saved view state for this model
      const savedState = modelStates.current.get(modelUri);
      if (savedState) {
        editor.restoreViewState(savedState);
        editor.focus();
      }
    }
  }, [filePath, content]);

  // listen for changes to the editor
  const _saveTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && onSave) {
      const disposable = editor.onDidChangeModelContent(() => {
        const val = editor.getValue();
        onChange?.(val);

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
  }, [onSave, onChange, filePath]); // Re-bind if onSave changes or we switched files

  return (
    <div
      ref={monacoEl}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    ></div>
  );
}
