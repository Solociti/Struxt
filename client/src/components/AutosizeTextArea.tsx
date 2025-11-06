import { useEffect, useRef } from "react";
import type { FormControlProps } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { useRealChange } from "./useRealChange";

interface FormInputProps extends FormControlProps {
  value: string;
  onRealChange: (value: string) => void;

  /**
   * Maximum number of rows to expand to before scrolling.
   *
   * @default 5
   */
  maxRows?: number;
}

/**
 * Setup an auto-sizing text area.
 *
 * @param param0
 */
export function AutosizeTextArea({
  onRealChange,
  onChange,
  onBlur,
  onKeyDown,
  value,
  maxRows = 5,
  ...props
}: FormInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const eventProps = useRealChange(value, onRealChange, {
    onChange,
    onBlur,
    onKeyDown,
    commitOnEnter: true,
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";

      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = parseInt(
        window.getComputedStyle(textareaRef.current).lineHeight || "20",
        10
      );

      const maxHeight = lineHeight * maxRows;

      textareaRef.current.style.height =
        Math.min(scrollHeight, maxHeight) + "px";
    }
  }, [eventProps.value]);

  return (
    <Form.Control
      as="textarea"
      rows={2}
      style={{ resize: "none", overflow: "auto" }}
      type="text"
      {...props}
      {...eventProps}
      ref={textareaRef}
    />
  );
}
