import { useTheme } from "client/bootstrap/Theme";
import { RoutineListItem, RoutineModel } from "common/models/routines/Routine";
import * as monaco from "monaco-editor";
import { useCallback, useEffect, useRef } from "react";
import { saveRoutine } from "../list/routineApis";
import "./codeWorker";

const createUri = (path: string, name: string) =>
  monaco.Uri.parse(`file://${path}${name}`);

/**
 *
 * @param param0
 * @returns
 */
export default function CodeEditor({
  routine,
  openRoutines,
}: {
  routine: RoutineModel;
  openRoutines: RoutineListItem[];
}) {
  const { theme } = useTheme();

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);
  const modelStates = useRef<Map<string, monaco.editor.ICodeEditorViewState>>(
    new Map()
  );

  useEffect(() => {
    monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs-light");
  }, [theme]);

  /**
   * Get the model for the current routine.
   */
  const getModel = useCallback(() => {
    const uri = createUri(routine.path, routine.name);
    let model = monaco.editor.getModel(uri);

    if (!model) {
      model = monaco.editor.createModel(routine.contents, undefined, uri);
    }

    return model;
  }, [routine.path, routine.name, routine.contents]);

  useEffect(() => {
    if (monacoEl.current && !editorRef.current) {
      const tm = getModel();

      editorRef.current = monaco.editor.create(monacoEl.current!, {
        model: tm,
        theme: theme === "dark" ? "vs-dark" : "vs-light",
      });
    }

    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;

      // dispose of all models
      monaco.editor.getModels().forEach((model) => model.dispose());
    };
  }, []);

  // update the editor when the routine changes
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
      // Same model, just update contents if needed
      model.setValue(routine.contents);
    }
  }, [routine.uuid, getModel, routine.contents]);

  // listen for changes to the editor
  const _saveTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const disposable = editor.onDidChangeModelContent(() => {
        routine.contents = editor.getValue();

        if (_saveTimeout.current) {
          clearTimeout(_saveTimeout.current);
        }

        _saveTimeout.current = setTimeout(async () => {
          _saveTimeout.current = null;

          await saveRoutine(routine);
        }, 1000);
      });

      return () => disposable.dispose();
    }
  }, [routine]);

  // dispose models that are no longer open
  const lastOpenCheck = useRef<RoutineListItem[]>(openRoutines);
  useEffect(() => {
    for (const item of lastOpenCheck.current) {
      if (!openRoutines.find((i) => i.uuid === item.uuid)) {
        const uri = createUri(item.path, item.name);
        monaco.editor.getModel(uri)?.dispose();
      }
    }

    lastOpenCheck.current = openRoutines;
  }, [openRoutines]);

  return (
    <div
      ref={monacoEl}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    ></div>
  );
}
