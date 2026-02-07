import { describe, it, expect } from "vitest";
import * as nodePath from "node:path";
import {
  resolve,
  normalize,
  isAbsolute,
  join,
  relative,
  dirname,
  basename,
  extname,
  format,
  parse,
  sep,
  delimiter,
} from "./path";

const posix = nodePath.posix;

describe("path (browser/posix) comparison with node:path", () => {
  it("should have correct separator and delimiter", () => {
    expect(sep).toBe(posix.sep);
    expect(delimiter).toBe(posix.delimiter);
  });

  describe("resolve", () => {
    // Note: Our resolve assumes '/' as cwd. Node's resolve uses process.cwd().
    // To compare fairly, we prepend '/' to node's resolve arguments if the inputs are relative,
    // or just rely on the fact that if we start with an absolute path, they match.
    // Actually, `posix.resolve('/', ...args)` simulates our behavior exactly since our cwd is effectively '/'.

    const testCases = [
      ["/foo/bar", "./baz"],
      ["/foo/bar", "/tmp/file/"],
      ["wwwroot", "static_files/png/", "../gif/image.gif"],
      ["a", "b", "c"],
    ];

    testCases.forEach((args) => {
      it(`should match node.resolve for ${JSON.stringify(args)}`, () => {
        const expected = posix.resolve("/", ...args);
        const actual = resolve(...args);
        expect(actual).toBe(expected);
      });
    });
  });

  describe("normalize", () => {
    const testCases = [
      "/foo/bar//baz/asdf/quux/..",
      "./foo/./bar/",
      "/foo/../../bar",
      "/a//b",
    ];

    testCases.forEach((p) => {
      it(`should match node.normalize for "${p}"`, () => {
        expect(normalize(p)).toBe(posix.normalize(p));
      });
    });
  });

  describe("isAbsolute", () => {
    const testCases = ["/foo/bar", "/baz/..", "qux/", "."];

    testCases.forEach((p) => {
      it(`should match node.isAbsolute for "${p}"`, () => {
        expect(isAbsolute(p)).toBe(posix.isAbsolute(p));
      });
    });
  });

  describe("join", () => {
    const testCases = [
      ["/foo", "bar", "baz/asdf", "quux", ".."],
      ["a/b", "../c"],
    ];

    testCases.forEach((args) => {
      it(`should match node.join for ${JSON.stringify(args)}`, () => {
        expect(join(...args)).toBe(posix.join(...args));
      });
    });

    it("should match error behavior for invalid input", () => {
      // @ts-expect-error Testing invalid input
      expect(() => join("foo", {}, "bar")).toThrow(TypeError);
    });
  });

  describe("relative", () => {
    const testCases = [
      ["/data/orandea/test/aaa", "/data/orandea/impl/bbb"],
      ["/", "/var"],
      ["/var", "/"],
    ];

    testCases.forEach(([from, to]) => {
      it(`should match node.relative for "${from}" -> "${to}"`, () => {
        // Our relative implementation uses `resolve` internally which uses '/' as root.
        // Node's relative uses process.cwd().
        // However, relative paths between two relative paths should be the same regardless of root base.
        // But if we mix absolute and relative...
        // relative('/a', 'b') -> from /a to /cwd/b
        // relative('/a', 'b') in our shim -> from /a to /b
        // So we must normalize the comparison by using resolve('/', ...) for node too if we want to match our shim's "root=/" assumption.

        const expected = posix.relative(
          posix.resolve("/", from),
          posix.resolve("/", to),
        );
        const actual = relative(from, to);
        expect(actual).toBe(expected);
      });
    });
  });

  describe("dirname", () => {
    const testCases = [
      "/foo/bar/baz/asdf/quux",
      "/foo/bar/baz/asdf/quux/",
      "foo",
      "/",
      "/path/to/",
    ];

    testCases.forEach((p) => {
      it(`should match node.dirname for "${p}"`, () => {
        expect(dirname(p)).toBe(posix.dirname(p));
      });
    });
  });

  describe("basename", () => {
    const testCases: [string, string | undefined][] = [
      ["/foo/bar/baz/asdf/quux.html", undefined],
      ["/foo/bar/baz/asdf/quux.html", ".html"],
      ["/foo/bar/baz/asdf/", undefined],
    ];

    testCases.forEach(([p, ext]) => {
      it(`should match node.basename for "${p}" ext: "${ext}"`, () => {
        if (ext) {
          expect(basename(p, ext)).toBe(posix.basename(p, ext));
        } else {
          expect(basename(p)).toBe(posix.basename(p));
        }
      });
    });
  });

  describe("extname", () => {
    const testCases = [
      "index.html",
      "index.coffee.md",
      "index.",
      "index",
      ".index",
    ];

    testCases.forEach((p) => {
      it(`should match node.extname for "${p}"`, () => {
        expect(extname(p)).toBe(posix.extname(p));
      });
    });
  });

  describe("format", () => {
    const testCases = [
      {
        root: "/",
        dir: "/home/user/dir",
        base: "file.txt",
        ext: ".txt",
        name: "file",
      },
      {
        root: "/",
        base: "file.txt",
        ext: ".txt",
        name: "file",
      },
    ];

    testCases.forEach((obj) => {
      it(`should match node.format for ${JSON.stringify(obj)}`, () => {
        expect(format(obj)).toBe(posix.format(obj));
      });
    });
  });

  describe("parse", () => {
    const testCases = ["/home/user/dir/file.txt", "/home/user/dir/"];

    testCases.forEach((p) => {
      it(`should match node.parse for "${p}"`, () => {
        expect(parse(p)).toEqual(posix.parse(p));
      });
    });
  });
});
