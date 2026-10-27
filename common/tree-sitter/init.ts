import { Language, Parser, Query } from "web-tree-sitter";

const runtimePath = "/dashboard/parsers/web-tree-sitter.wasm";
const javascriptPath = "/dashboard/parsers/tree-sitter-javascript.wasm";

export interface TreeSitterManager {
  Query: typeof Query;

  parser: Parser;
  setJsLang: () => Promise<Language>;
}

export interface InitTreeSitterOptions {
  locateFile?: (scriptName: string) => string;
}

/**
 * Init web-tree-sitter and return a management object for the parser instance.
 *
 */
export default async function initTreeSitter({
  locateFile: locateFileConf,
}: InitTreeSitterOptions = {}): Promise<TreeSitterManager> {
  const locateFile =
    locateFileConf ||
    ((scriptName: string) => {
      switch (scriptName) {
        case "web-tree-sitter.wasm":
          return runtimePath;
        case "tree-sitter-javascript.wasm":
          return javascriptPath;
        default:
          return scriptName;
      }
    });

  await Parser.init({
    locateFile,
  });

  const parser = new Parser();

  return {
    Query,
    parser,
    async setJsLang() {
      const JavaScript = await Language.load(
        locateFile("tree-sitter-javascript.wasm"),
      );
      parser.setLanguage(JavaScript);

      return JavaScript;
    },
  };
}
