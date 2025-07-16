import React, { useEffect, useState } from "react";
import type { FormControlProps } from "react-bootstrap";
import Form from "react-bootstrap/Form";

interface FormInputProps extends FormControlProps {
  value: string;
  onRealChange: (value: string) => void;
}

/**
 * FormInput component that handles input changes and provides a controlled input field.
 * Fires onRealChange only when the value actually changes (commit, blur, etc), not on every keystroke.
 *
 * @param onRealChange - Callback function called when the value actually changes
 * @param onChange - Standard React onChange event (optional)
 * @param onBlur - Standard React onBlur event (optional)
 * 
 * @param value - The controlled value from parent component

* @returns FormInput component
 */
export function FormInput({
  onRealChange,
  onChange,
  onBlur,
  onKeyDown,
  value: valueIn,
  ...props
}: FormInputProps) {
  const [value, setValue] = useState(valueIn || "");
  const [lastCommittedValue, setLastCommittedValue] = useState(valueIn || "");

  const hasEdits = value !== lastCommittedValue;

  useEffect(() => {
    if (!hasEdits && valueIn !== value) {
      setValue(valueIn);
      setLastCommittedValue(valueIn);
    }
  }, [valueIn, hasEdits, value]);

  /**
   * Commit the change to the input value.
   *
   * @param newValue
   */
  const commitChange = (newValue: string) => {
    if (newValue !== lastCommittedValue) {
      setLastCommittedValue(newValue);
      onRealChange(newValue);
    }
  };

  /**
   * Listen for value changes
   *
   * @param e
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (onChange) {
      onChange(e);
    }
  };

  /**
   * Listen for the blur event to do a real change event.
   *
   * @param e
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    commitChange(value);

    if (onBlur) {
      onBlur(e);
    }
  };

  /**
   * Use the keydown event to commit the change if Enter is pressed.
   *
   * @param e
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
    }

    if (e.key === "Enter" && value !== lastCommittedValue) {
      commitChange(value);
    }
  };

  const input = (
    <Form.Control
      {...props}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );

  return input;
}
