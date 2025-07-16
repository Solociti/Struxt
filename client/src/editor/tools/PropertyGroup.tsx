interface PropertyGroupProps {
  label: string;
  children: React.ReactNode;

  size?: "sm" | "md" | "lg";
}

export function PropertyGroup({ label, children, size }: PropertyGroupProps) {
  let className = "mb-3 px-1";
  let labelClass = "mb-2 text-capitalize";
  if (size === "sm") {
    className = "mb-2 px-1";
    labelClass = "mb-1 text-capitalize";
  } else if (size === "lg") {
    className = "my-3 px-1";
  }

  return (
    <div className={className}>
      <div className={labelClass}>{label}</div>

      {children}
    </div>
  );
}
