import type { FormControlProps } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { useRealChange } from "./useRealChange";

interface FormInputProps extends FormControlProps {
  value: string;
  onRealChange: (value: string) => void;
}

/**
 * FormInput component that handles input changes and provides a controlled input field.
 * Fires onRealChange only when the value actually changes (commit, blur, etc), not on every keystroke.
 *
 * @param onRealChange Callback function called when the value actually changes
 * @param onChange Standard React onChange event (optional)
 * @param onBlur Standard React onBlur event (optional)
 * 
 * @param value The controlled value from parent component

* @returns FormInput component
 */
export function FormInput({
  onRealChange,
  onChange,
  onBlur,
  onKeyDown,
  value,
  ...props
}: FormInputProps) {
  const eventProps = useRealChange(value, onRealChange, {
    onChange,
    onBlur,
    onKeyDown,
    commitOnEnter: true,
  });

  return <Form.Control {...props} {...eventProps} />;
}
