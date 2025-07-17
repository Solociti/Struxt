import React, { useEffect, useState } from "react";

/**
 * Convert the rapid react key change to the real javascript change.
 *
 * @param valueIn
 * @param onRealChange
 * @returns
 */
export function useRealChange(
  valueIn: string,
  onRealChange: (value: string) => void,
  options: {
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    commitOnEnter?: boolean;
  } = {}
) {
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

    if (options.onChange) {
      options.onChange(e);
    }
  };

  /**
   * Listen for the blur event to do a real change event.
   *
   * @param e
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    commitChange(value);

    if (options.onBlur) {
      options.onBlur(e);
    }
  };

  /**
   * Use the keydown event to commit the change if Enter is pressed.
   *
   * @param e
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (options.onKeyDown) {
      options.onKeyDown(e);
    }

    if (options.commitOnEnter && e.key === "Enter") {
      commitChange(value);
    }
  };

  return {
    value,
    onChange: handleChange,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
  };
}
