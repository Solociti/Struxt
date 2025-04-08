export function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode | React.ReactNode[];
  className?: string;
}) {
  return (
    <div
      className={
        "bg-white shadow rounded-lg overflow-hidden" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-xl font-medium text-gray-900">{title}</h2>
      </div>

      <div className="px-6 py-5">{children}</div>
    </div>
  );
}
