export type FissionRuntimes =
  | "nodejs"
  | "python"
  | "go"
  | "php"
  | "java"
  | "perl"
  | "ruby"
  | "dotnet";

/**
 * The list of potential runtimes
 */
export const fissionRuntimes: FissionRuntimes[] = [
  "nodejs",
  "python",
  "go",
  "php",
  "java",
  "perl",
  "ruby",
  "dotnet",
];

/**
 * Get the list of default file patterns to include in the fission package for a given runtime.
 *
 * @param runtime
 * @returns
 */
export function defaultFilesForRuntime(runtime: FissionRuntimes): string[] {
  switch (runtime) {
    case "nodejs":
      return [
        "routines/**/*.js",
        "routines/**/*.mjs",
        "routines/**/*.cjs",
        "routines/**/*.json",
      ];
    case "python":
      return ["routines/**/*.py", "routines/**/*.txt", "routines/**/*.toml"];
    case "go":
      return ["routines/**/*.go", "routines/**/*.mod", "routines/**/*.sum"];
    case "php":
      return ["routines/**/*.php", "routines/**/*.json"];
    case "java":
      return [
        "routines/**/*.java",
        "routines/**/*.jar",
        "routines/**/*.xml",
        "routines/**/*.gradle",
      ];
    case "perl":
      return ["routines/**/*.pl", "routines/**/*.pm", "routines/**/*.t"];
    case "ruby":
      return [
        "routines/**/*.rb",
        "routines/**/*.json",
        "routines/**/*.gemspec",
      ];
    case "dotnet":
      return ["routines/**/*.cs", "routines/**/*.dll", "routines/**/*.csproj"];
    default:
      return ["routines/**/*"];
  }
}
