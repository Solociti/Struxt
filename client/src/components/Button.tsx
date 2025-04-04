import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps {
  children?: ReactNode;
  outline?: boolean;
  loading?: boolean;
  variant: "primary" | "secondary";
}

function setupClassName(
  className: string,
  variant: ButtonProps["variant"],
  outline: boolean
) {
  className +=
    " font-medium rounded-lg text-sm px-3 py-2 me-2 focus:outline-none cursor-pointer transition-colors duration-300";

  if (outline) {
    className += " hover:text-white";
  } else {
    className += " text-white";
  }

  if (variant === "primary") {
    className +=
      " hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed disabled:hover:bg-blue-400";
    if (outline) {
      className += " text-blue-700 border border-blue-700";
    } else {
      className += " bg-blue-600";
    }
  } else if (variant === "secondary") {
    className +=
      " hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400";
    if (outline) {
      className += " text-gray-600 border border-gray-600";
    } else {
      className += " bg-gray-600";
    }
  }

  return className.trim();
}

export function Button({
  children,
  outline = false,
  loading = false,
  variant,
  ...props
}: ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={setupClassName(props.className || "", variant, outline)}
    >
      {children}
    </button>
  );
}

export function AnchorButton({
  children,
  outline = false,
  loading = false,
  variant,
  ...props
}: ButtonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      className={setupClassName(props.className || "", variant, outline)}
    >
      {children}
    </a>
  );
}
