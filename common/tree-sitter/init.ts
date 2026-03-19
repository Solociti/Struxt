import { Language, Parser } from "web-tree-sitter";

export interface TreeSitterWasmPaths {
  runtime: string;
  javascript: string;
}

/**
 * Builds the default wasm paths served by Vite static copy.
 *
 * @param basePath
 */
export function getDefaultTreeSitterWasmPaths(
  basePath = "/parsers",
): TreeSitterWasmPaths {
  const normalizedBasePath = basePath.endsWith("/")
    ? basePath.slice(0, basePath.length - 1)
    : basePath;

  return {
    runtime: `${normalizedBasePath}/tree-sitter.wasm`,
    javascript: `${normalizedBasePath}/tree-sitter-javascript.wasm`,
  };
}

/**
 * Initializes web-tree-sitter and returns a JavaScript parser instance.
 *
 * @param wasmPaths
 */
export async function initJavaScriptTreeSitterParser(
  wasmPaths: TreeSitterWasmPaths = getDefaultTreeSitterWasmPaths(),
): Promise<Parser> {
  await Parser.init({
    locateFile(scriptName: string) {
      if (scriptName === "tree-sitter.wasm") {
        return wasmPaths.runtime;
      }

      return scriptName;
    },
  });

  const parser = new Parser();
  const language = await Language.load(wasmPaths.javascript);
  parser.setLanguage(language);

  return parser;
}
