import { ViewUpdate } from "@uiw/react-codemirror";
import React, { useEffect, useState } from "react";

/**
 * Convert the rapid react key change to the real javascript change.
 *
 * @param valueIn
 * @param onRealChange
 * @returns
 */
export function useCodeRealChange(
  valueIn: string,
  onRealChange: (value: string) => void,
  options: {
    onChange?: (value: string, viewUpdate: ViewUpdate) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
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
   * @param newValue
   */
  const handleChange = (newValue: string, viewUpdate: ViewUpdate) => {
    setValue(newValue);

    if (options.onChange) {
      options.onChange(newValue, viewUpdate);
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

  return {
    value,
    onChange: handleChange,
    onBlur: handleBlur,
  };
}
