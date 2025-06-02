import React from "react";

type MaterialIconProps = {
  filled?: boolean;
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

export default function MaterialIcon({
  filled,
  className,
  style,
  ...props
}: MaterialIconProps) {
  className = `material-symbols-outlined ${className || ""}`.trim();

  const elStyle = {
    ...style,
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
  };

  return (
    <i {...props} style={elStyle} className={className}>
      {props.children}
    </i>
  );
}
