import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import { useAsyncCallback } from "../useAsyncCallback";
import SimpleModal from "./SimpleModal";
import { ShowError } from "../ShowError";

interface ConfirmModalProps {
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
  onConfirm: () => void;
  /**
   * Callback to cancel the action.
   *
   * @returns
   */
  onCancel?: () => void;
}

/**
 * Setup a confirm modal
 *
 * @param param0
 * @returns
 */
export function useConfirmModal({
  title,
  message,
  confirmButtonText,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const [show, setShow] = useState(false);

  const handleSubmit = useAsyncCallback(async () => {
    await onConfirm();

    setShow(false);
  });

  useEffect(() => {
    // reset the callback state
    handleSubmit.reset();
  }, [show]);

  const confirmModal = (
    <SimpleModal
      show={show}
      onHide={() => setShow(false)}
      title={title}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setShow(false);
              if (onCancel) {
                onCancel();
              }
            }}
          >
            Cancel
          </Button>

          <Button
            variant="warning"
            disabled={handleSubmit.isLoading}
            onClick={handleSubmit.callback}
          >
            {confirmButtonText || "Confirm"}
          </Button>
        </>
      }
    >
      <ShowError error={handleSubmit.error} />

      <div className="my-2">{message}</div>
    </SimpleModal>
  );

  return {
    confirmModal,
    showConfirmModal: () => setShow(true),
  };
}
