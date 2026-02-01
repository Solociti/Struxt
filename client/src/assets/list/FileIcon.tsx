/**
 * Creates a file icon based on the file extension.
 *
 * @param param0
 * @returns
 */
export function FileIcon({ extension }: { extension: string }) {
  let iconText = "";
  let iconColour = "lightblue";
  switch (extension) {
    case "js":
      iconColour = "orange";
      iconText = "JS";
      break;

    case "json":
      iconText = "{ }";
      iconColour = "orange";
      break;

    case "html":
      iconText = "</>";
      iconColour = "yellow";
      break;

    default:
      iconText = extension.substring(0, 4).toUpperCase();
  }

  return (
    <div style={{ minWidth: "1.65em", width: "1.65em" }}>
      {iconText ? (
        <svg viewBox="0 0 120 75" style={{ width: "100%" }}>
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill={iconColour}
            fontSize="45"
            fontWeight="bold"
          >
            {iconText}
          </text>
        </svg>
      ) : (
        <svg viewBox="0 0 120 75" style={{ width: "100%" }}>
          <rect x="25" y="15" width="60" height="8" rx="4" fill={iconColour} />
          <rect x="25" y="30" width="25" height="8" rx="4" fill={iconColour} />
          <rect x="25" y="45" width="54" height="8" rx="4" fill={iconColour} />
          <rect x="25" y="60" width="35" height="8" rx="4" fill={iconColour} />
        </svg>
      )}
    </div>
  );
}
