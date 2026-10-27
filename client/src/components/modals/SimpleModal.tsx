import Modal from "react-bootstrap/Modal";

interface SimpleModalProps {
  show: boolean;
  onHide: () => void;

  /**
   * Called after the modal is closed
   *
   * @returns
   */
  onExit?: () => void;

  title: string | React.ReactNode;

  children: React.ReactNode;

  footer?: React.ReactNode;

  size?: "sm" | "lg" | "xl";

  modalProps?: Omit<
    React.ComponentProps<typeof Modal>,
    "show" | "onHide" | "onExited" | "size"
  >;
}

export default function SimpleModal({
  children,
  onHide,
  onExit,
  show,
  size,
  title,
  footer = null,
  modalProps = {},
}: SimpleModalProps) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      onExited={onExit}
      size={size}
      {...modalProps}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>{children}</Modal.Body>

      {footer && <Modal.Footer>{footer}</Modal.Footer>}
    </Modal>
  );
}
