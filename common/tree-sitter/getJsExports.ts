import { Language } from "web-tree-sitter";
import initTreeSitter, {
  InitTreeSitterOptions,
  TreeSitterManager,
} from "./init";

let tsManager: TreeSitterManager | null = null;
let JavaScript: Language | null = null;

/**
 * Get the Tree Sitter Manager and setup the JavaScript language if not already done.
 *
 * @param options
 * @returns
 */
async function getManager(options?: InitTreeSitterOptions) {
  if (!tsManager) {
    tsManager = await initTreeSitter(options);
    JavaScript = await tsManager.setJsLang();
  }
  return {
    ...tsManager,
    JavaScript: JavaScript as Language,
  };
}

/**
 * Get the list of exports from the given js file contents.
 *
 * Should support both ESM and CJS
 *
 * @param contents
 * @param options
 */
export async function getJsExports(
  contents: string,
  options?: InitTreeSitterOptions,
) {
  const { parser, Query, JavaScript } = await getManager(options);

  const tree = parser.parse(contents);
  if (!tree) {
    return [];
  }

  // AI-Slop Query: Define the Query String (Combined ESM and CJS)
  const queryString = `
      ; --- ESM ---
      ; 1. Named declarations (test8, test9)
      ; We look for any declaration type inside the export
      (export_statement [
        (function_declaration name: (identifier) @name)
        (lexical_declaration (variable_declarator name: (identifier) @name))
        (variable_declaration (variable_declarator name: (identifier) @name))
      ])

      ; 2. Export lists and Aliases (test10, alternateName, test12, test13)
      (export_statement (export_clause [
        (export_specifier alias: (identifier) @name)
        (export_specifier name: (identifier) @name !alias)
      ]))

      ; 3. Default Exports
      (export_statement
        "default"
        (_) @default_export
      )

      ; --- CJS ---
      ; 4. exports.test1 or module.exports.test3
      (assignment_expression 
        left: (member_expression 
          object: [
            (identifier) @obj (#eq? @obj "exports")
            (member_expression object: (identifier) @mod property: (property_identifier) @exp (#eq? @mod "module") (#eq? @exp "exports"))
          ]
          property: (property_identifier) @name))

      ; 5. module.exports = { test5, test6 }
      (assignment_expression
        left: (member_expression object: (identifier) @mod property: (property_identifier) @exp (#eq? @mod "module") (#eq? @exp "exports"))
        right: (object [
          (pair key: (property_identifier) @name)
          (method_definition name: (property_identifier) @name)
          (shorthand_property_identifier_pattern) @name
        ]))
    `;

  try {
    const query = new Query(JavaScript, queryString);

    const captures = query.captures(tree.rootNode);
    const exportNames = captures
      .filter(
        (capture) =>
          capture.name === "name" || capture.name === "default_export",
      )
      .filter((capture) => {
        let parent = capture.node.parent;
        while (parent) {
          if (parent.type === "export_statement") {
            const isDefault = parent.text.startsWith("export default");
            if (capture.name === "default_export") {
              return isDefault;
            }
            if (capture.name === "name") {
              return !isDefault;
            }
          }

          parent = parent.parent;
        }

        return capture.name === "name";
      })
      .map((capture) => {
        if (capture.name === "default_export") {
          return "default";
        }
        return capture.node.text;
      });

    return [...new Set(exportNames)];
  } catch (err) {
    console.error("Tree-sitter Query Error:", err);
    return [];
  }
}
