import { FissionRuntimes } from "common/models/routines/runtimes";
import { FissionEnvironment } from "./types";

/**
 * Utility function to determine the runtime type (e.g. nodejs, python, etc.) from a Fission environment spec.
 *
 * @param env
 * @returns
 */
export function getRuntimeFromEnv(
  env: FissionEnvironment,
): FissionRuntimes | null {
  const imageName = env.spec.runtime.image.split("/").pop()?.trim();
  if (!imageName) {
    return null;
  }

  if (imageName.startsWith("node")) {
    return "nodejs";
  }
  if (imageName.startsWith("python")) {
    return "python";
  }
  if (imageName.startsWith("go")) {
    return "go";
  }
  if (imageName.startsWith("php")) {
    return "php";
  }
  if (imageName.startsWith("jvm")) {
    return "java";
  }
  if (imageName.startsWith("perl")) {
    return "perl";
  }
  if (imageName.startsWith("ruby")) {
    return "ruby";
  }
  if (imageName.startsWith("dotnet")) {
    return "dotnet";
  }

  return null;
}
