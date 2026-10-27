import { join } from "path";
import { describe, expect, test } from "vitest";
import { getJsExports } from "./getJsExports";

// CJS
/**
 * Named property on exports
 */
const test1 = "exports.test1 = function test1() {};";

/**
 * Anonymous function on exports
 */
const test2 = "exports.test2 = function() {};";

/**
 * Named property on module.exports
 */
const test3 = "module.exports.test3 = function test3() {};";

/**
 * Anonymous function on module.exports
 */
const test4 = "module.exports.test4 = function() {};";

/**
 * Exporting an object literal
 */
const test5and6 = `module.exports = {
  test5: function() {},
  test6() {}
};`;

/**
 * Single default export (replacing module.exports) - should be blank / ignored
 */
const test7 = "module.exports = function test7() {};";

// ESM
/**
 * Named declaration
 */
const test8 = "export function test8() {}";

/**
 * Named constant/variable
 */
const test9 = "export const test9 = () => {};";

/**
 * Export list (for existing functions)
 */
const test10 = `function test10() {}
export { test10 };`;

/**
 * Renamed export
 */
const test10Alt = "export { test10 as alternateName };";

/**
 * Default declaration
 */
const test11 = "export default function test11() {}";

/**
 * Anonymous default export
 */
const test12 = "export default function() {}";

/**
 * Re-exporting specific functions from another file
 */
const test13and14 = "export { test13, test14 } from './other-file.js';";

const fixtureContents = [
  test1,
  test2,
  test3,
  test4,
  test5and6,
  test7,
  test8,
  test9,
  test10,
  test10Alt,
  test11,
  test12,
  test13and14,
].join("\n\n");

const initOptions = {
  locateFile: (scriptName: string) => {
    if (scriptName === "tree-sitter-javascript.wasm") {
      return join(
        import.meta.dirname,
        "../../client/public/dashboard/parsers/tree-sitter-javascript.wasm",
      );
    }
    if (scriptName === "web-tree-sitter.wasm") {
      return join(
        import.meta.dirname,
        "../../client/public/dashboard/parsers/web-tree-sitter.wasm",
      );
    }
    return scriptName;
  },
};

describe("getJsExports", () => {
  test("should return the exported names from the shared fixture", async () => {
    const exportNames = await getJsExports(fixtureContents, initOptions);

    expect([...exportNames]).toEqual([
      "test1",
      "test2",
      "test3",
      "test4",
      "test5",
      "test6",
      "test8",
      "test9",
      "test10",
      "alternateName",
      "default",
      "test13",
      "test14",
    ]);
  });

  describe("check each test individually", () => {
    test("CJS - test1", async () => {
      await expect(getJsExports(test1, initOptions)).resolves.toEqual([
        "test1",
      ]);
    });

    test("CJS - test2", async () => {
      await expect(getJsExports(test2, initOptions)).resolves.toEqual([
        "test2",
      ]);
    });

    test("CJS - test3", async () => {
      await expect(getJsExports(test3, initOptions)).resolves.toEqual([
        "test3",
      ]);
    });

    test("CJS - test4", async () => {
      await expect(getJsExports(test4, initOptions)).resolves.toEqual([
        "test4",
      ]);
    });

    test("CJS - test5and6", async () => {
      const exports = await getJsExports(test5and6, initOptions);
      expect([...exports]).toEqual(["test5", "test6"]);
    });

    test("CJS - test7", async () => {
      await expect(getJsExports(test7, initOptions)).resolves.toEqual([]);
    });

    test("ESM - test8", async () => {
      await expect(getJsExports(test8, initOptions)).resolves.toEqual([
        "test8",
      ]);
    });

    test("ESM - test9", async () => {
      await expect(getJsExports(test9, initOptions)).resolves.toEqual([
        "test9",
      ]);
    });

    test("ESM - test10", async () => {
      await expect(getJsExports(test10, initOptions)).resolves.toEqual([
        "test10",
      ]);
    });

    test("ESM - test10Alt", async () => {
      await expect(getJsExports(test10Alt, initOptions)).resolves.toEqual([
        "alternateName",
      ]);
    });

    test("ESM - test11", async () => {
      await expect(getJsExports(test11, initOptions)).resolves.toEqual([
        "default",
      ]);
    });

    test("ESM - test12", async () => {
      await expect(getJsExports(test12, initOptions)).resolves.toEqual([
        "default",
      ]);
    });

    test("ESM - test13and14", async () => {
      await expect(getJsExports(test13and14, initOptions)).resolves.toEqual([
        "test13",
        "test14",
      ]);
    });
  });

  test("should not return duplicate export names", async () => {
    const contentsWithDuplicates = [test4, test4, test8, test8].join("\n\n");

    await expect(
      getJsExports(contentsWithDuplicates, initOptions),
    ).resolves.toEqual(["test4", "test8"]);
  });

  test("should not include functions or variables that are not exported", async () => {
    const contentsWithInternalSymbols = `${fixtureContents}

function hiddenFunction() {}
const hiddenValue = 1;
const hiddenArrow = () => {};
`;

    const exportNames = await getJsExports(
      contentsWithInternalSymbols,
      initOptions,
    );

    expect(exportNames).not.toContain("hiddenFunction");
    expect(exportNames).not.toContain("hiddenValue");
    expect(exportNames).not.toContain("hiddenArrow");
  });
});
