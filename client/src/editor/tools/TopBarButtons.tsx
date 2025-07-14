import { useEditor } from "@grapesjs/react";
import IconButton from "client/components/IconButton";
import { useEffect, useState } from "react";

interface CommandButton {
  id: string;
  icon: string;

  options?: Record<string, any>;

  disabled?: () => boolean;
  spinner?: () => boolean;
}

/**
 * Create the top center toolbar
 *
 * @returns
 */
export function TopBarButtons() {
  const [_counter, setUpdateCounter] = useState(0);

  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor();
  const { UndoManager, Commands } = editor;

  const cmdButtons: CommandButton[] = [
    {
      id: "core:component-outline",
      icon: "select",
    },
    {
      id: "core:fullscreen",
      icon: "fullscreen",
      options: { target: "#app" },
    },
    {
      id: "core:open-code",
      icon: "code",
    },
    {
      id: "core:undo",
      icon: "undo",
      disabled: () => !UndoManager.hasUndo(),
    },
    {
      id: "core:redo",
      icon: "redo",
      disabled: () => !UndoManager.hasRedo(),
    },
    {
      id: "struxt:save",
      icon: "save",
      spinner: () => isSaving,
    },
  ];

  useEffect(() => {
    const updateCounter = () => setUpdateCounter((value) => value + 1);
    const onCommand = (event: { id: string }) => {
      const match = cmdButtons.find((btn) => btn.id === event.id);
      if (match) {
        updateCounter();
      }
    };

    const onStoreStart = () => setIsSaving(true);
    const onStoreEnd = () => setIsSaving(false);

    editor.on("command:run", onCommand);
    editor.on("command:stop", onCommand);

    editor.on("component:update", updateCounter);

    editor.on("storage:start", onStoreStart);
    editor.on("storage:end", onStoreEnd);

    return () => {
      editor.off("command:run", onCommand);
      editor.off("command:stop", onCommand);

      editor.off("component:update", updateCounter);

      editor.off("storage:start", onStoreStart);
      editor.off("storage:end", onStoreEnd);
    };
  }, []);

  return (
    <div className="d-flex align-items-center gap-1 px-2">
      {cmdButtons.map(({ id, icon, disabled, spinner, options = {} }) => (
        <IconButton
          key={id}
          icon={icon}
          size="sm"
          variant={Commands.isActive(id) ? "secondary" : "outline-secondary"}
          onClick={() => {
            Commands.isActive(id)
              ? Commands.stop(id)
              : Commands.run(id, options);
          }}
          disabled={disabled?.()}
          spinner={spinner?.()}
        ></IconButton>
      ))}
    </div>
  );
}
