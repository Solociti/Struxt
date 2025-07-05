import { describe, expect, test } from "vitest";
import { parseLabels } from "./parseLabels";

describe("Docker parseLabels", () => {
  test("parses single label", () => {
    const input = "foo=bar";
    const result = parseLabels(input);
    expect(result).toEqual({ foo: "bar" });
  });

  test("parses multiple labels", () => {
    const input = "foo=bar,hello=world";
    const result = parseLabels(input);
    expect(result).toEqual({ foo: "bar", hello: "world" });
  });

  test("trims whitespace around keys and values", () => {
    const input = " foo = bar , hello = world ";
    const result = parseLabels(input);
    expect(result).toEqual({ foo: "bar", hello: "world" });
  });

  test("handles values with commas", () => {
    const input = "foo=bar,baz,hello=world";
    const result = parseLabels(input);
    expect(result).toEqual({ foo: "bar,baz", hello: "world" });
  });

  test("handles multiple values with commas", () => {
    const input = "foo=bar,baz,qux,hello=world";
    const result = parseLabels(input);
    expect(result).toEqual({ foo: "bar,baz,qux", hello: "world" });
  });

  test("handles empty string", () => {
    const input = "";
    const result = parseLabels(input);
    expect(result).toEqual({});
  });

  test("handles label with empty value", () => {
    const input = "foo=";
    const result = parseLabels(input);
    expect(result).toEqual({ foo: "" });
  });

  test("handles trailing comma", () => {
    const input = "foo=bar,";
    const result = parseLabels(input);
    expect(result).toEqual({ foo: "bar" });
  });

  test("handles leading comma", () => {
    const input = ",foo=bar";
    const result = parseLabels(input);
    expect(result).toEqual({ foo: "bar" });
  });
});
