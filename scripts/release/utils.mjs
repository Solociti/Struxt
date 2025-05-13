// @ts-check

/**
 * Increments the version number based on the release type.
 *
 * @param {string} version
 * @param {"major" | "minor" | "patch" | "pre"} releaseType
 */
export function incrementVersion(version, releaseType) {
  const [major, minor, patch, pre] = version
    .split(".")
    .map((val) => parseInt(val.replace(/[^0-9]/g, "")));

  let newVersion = "";
  switch (releaseType) {
    case "major":
      newVersion = `${major + 1}.0.0`;
      break;
    case "minor":
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case "patch":
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    case "pre":
      newVersion = `${major}.${minor}.${patch}-pre.${(pre || 0) + 1}`;
      break;
    default:
      throw new Error("Invalid release type");
  }

  return newVersion;
}
