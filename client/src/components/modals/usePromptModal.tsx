import { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import IconButton from "../IconButton";
import { ShowError } from "../ShowError";
import { useAsyncCallback } from "../useAsyncCallback";
import SimpleModal from "./SimpleModal";

interface UserPromptModalProps {
  title: string;
  message: string | React.ReactNode;

  /**
   * Text for the confirm button.
   */
  confirmButtonText?: string;

  /**
   * Callback to confirm the action.
   *
   * @returns
   */
  onConfirm: (text: string) => void;
  /**
   * Callback to cancel the action.
   *
   * @returns
   */
  onCancel?: () => void;
}

export function usePromptModal({
  title,
  message,
  confirmButtonText = "Confirm",
  onCancel,
  onConfirm,
}: UserPromptModalProps) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");

  const handleSubmit = useAsyncCallback(async () => {
    await onConfirm(text);
    setShow(false);
  });

  useEffect(() => {
    // reset the callback state
    handleSubmit.reset();
    setText("");
  }, [show]);

  const promptModal = (
    <SimpleModal
      show={show}
      onHide={() => setShow(false)}
      title={title}
      footer={
        <>
          <IconButton
            icon="close"
            variant="secondary"
            onClick={() => {
              setShow(false);
              onCancel?.();
            }}
          >
            Cancel
          </IconButton>
          <IconButton
            icon="check"
            variant="primary"
            onClick={handleSubmit.callback}
            spinner={handleSubmit.isLoading}
          >
            {confirmButtonText}
          </IconButton>
        </>
      }
    >
      {handleSubmit.error && <ShowError error={handleSubmit.error} />}
      <p>{message}</p>

      <Form.Control
        as="textarea"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </SimpleModal>
  );

  return {
    promptModal,
    showPrompt: () => setShow(true),
  };
}
