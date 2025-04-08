import { useId } from "react";

/**
 * Create a input group with a label and a input
 *
 * @param param0
 * @returns
 */
export function InputGroup({
  disabled,
  className,
  label,
  onChange,
  placeholder,
  type,
  value,
}: {
  disabled?: boolean;
  className?: string;
  label: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number";
  value?: string;
}) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        id={id}
        type={type || "text"}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(event) => {
          if (onChange) {
            onChange(event.target.value);
          }
        }}
      />
    </div>
  );
}

/**
 * Create a input group with a label and a textarea
 *
 * @param param0
 * @returns
 */
export function TextareaGroup({
  className,
  disabled,
  label,
  onChange,
  placeholder,
  value,
}: {
  className?: string;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(event) => {
          if (onChange) {
            onChange(event.target.value);
          }
        }}
      />
    </div>
  );
}
