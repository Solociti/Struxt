import { describe, expect, it } from "vitest";
import { createChangeList } from "./envUtils";
import { VariableState } from "common/models/projects/Environment";

const env = "staging" as const;

let _uuidCounter = 0;

function makeVar(
  name: string,
  value: string,
  isSecret = false,
  secretLength = 0,
  uuid?: string,
): VariableState {
  return {
    uuid: uuid ?? `uuid-${++_uuidCounter}`,
    name,
    value,
    isSecret,
    secretLength,
  };
}

function makeNew(
  name: string,
  value: string,
  isSecret = false,
  secretLength = 0,
): VariableState {
  return makeVar(name, value, isSecret, secretLength, `new-${++_uuidCounter}`);
}

describe("createChangeList", () => {
  it("skips variables with empty names", () => {
    const result = createChangeList(env, [], [makeNew("", "value")]);
    expect(result).toHaveLength(0);
  });

  it("skips variables with whitespace-only names", () => {
    const result = createChangeList(env, [], [makeNew("   ", "value")]);
    expect(result).toHaveLength(0);
  });

  it("adds new non-secret variable", () => {
    const v = makeNew("KEY", "val");
    const result = createChangeList(env, [], [v]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      env,
      update: { name: "KEY", value: "val", isSecret: false, secretLength: 0 },
    });
  });

  it("skips unchanged non-secret variable", () => {
    const original = [makeVar("KEY", "val")];
    const result = createChangeList(env, original, [
      { ...original[0] }, // same uuid, same value
    ]);
    expect(result).toHaveLength(0);
  });

  it("adds changed non-secret variable", () => {
    const original = [makeVar("KEY", "old")];
    const result = createChangeList(env, original, [
      { ...original[0], value: "new" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ update: { name: "KEY", value: "new" } });
  });

  it("skips existing secret with empty value (unchanged)", () => {
    const original = [makeVar("SECRET", "", true, 10)];
    const result = createChangeList(env, original, [{ ...original[0] }]);
    expect(result).toHaveLength(0);
  });

  it("adds existing secret with a new value", () => {
    const original = [makeVar("SECRET", "", true, 10)];
    const result = createChangeList(env, original, [
      { ...original[0], value: "newval" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      update: { name: "SECRET", value: "newval", isSecret: true },
    });
  });

  it("adds new secret with value", () => {
    const result = createChangeList(
      env,
      [],
      [makeNew("NEW_SECRET", "myval", true)],
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      update: { name: "NEW_SECRET", value: "myval", isSecret: true },
    });
  });

  it("emits remove with uuid for variable no longer present", () => {
    const original = [makeVar("OLD_KEY", "val")];
    const result = createChangeList(env, original, []);
    expect(result).toEqual([{ env, remove: original[0].uuid }]);
  });

  it("trims variable name before comparison", () => {
    const original = [makeVar("KEY", "val")];
    const result = createChangeList(env, original, [
      { ...original[0], name: "KEY  " },
    ]);
    expect(result).toHaveLength(0);
  });

  it("detects a rename as a single update (not remove + add)", () => {
    const original = [makeVar("OLD_NAME", "val")];
    const result = createChangeList(env, original, [
      { ...original[0], name: "NEW_NAME" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ update: { name: "NEW_NAME" } });
    expect(result.some((c) => "remove" in c)).toBe(false);
  });

  it("correctly differentiates renamed secret and new var with old name", () => {
    const secret = makeVar("TEST_1", "", true, 8);
    const original = [secret];

    // rename TEST_1 -> TEST_2, and add a new plain var TEST_1
    const newVar = makeNew("TEST_1", "plainval");
    const variables = [{ ...secret, name: "TEST_2" }, newVar];

    const result = createChangeList(env, original, variables);

    // secret rename = 1 update (no value change, just name)
    const secretUpdate = result.find(
      (c) => "update" in c && c.update.uuid === secret.uuid,
    );
    expect(secretUpdate).toMatchObject({ update: { name: "TEST_2" } });

    // new var TEST_1 = 1 update
    const newVarUpdate = result.find(
      (c) => "update" in c && c.update.uuid === newVar.uuid,
    );
    expect(newVarUpdate).toMatchObject({ update: { name: "TEST_1" } });

    // no removes
    expect(result.some((c) => "remove" in c)).toBe(false);
    expect(result).toHaveLength(2);
  });

  it("handles mix of adds, updates, and removes", () => {
    const keep = makeVar("KEEP", "same");
    const change = makeVar("CHANGE", "old");
    const remove = makeVar("REMOVE", "val");
    const original = [keep, change, remove];

    const variables = [
      { ...keep },
      { ...change, value: "new" },
      makeNew("NEW", "added"),
    ];

    const result = createChangeList(env, original, variables);

    expect(result).toContainEqual(
      expect.objectContaining({
        update: expect.objectContaining({ name: "CHANGE", value: "new" }),
      }),
    );
    expect(result).toContainEqual(
      expect.objectContaining({
        update: expect.objectContaining({ name: "NEW" }),
      }),
    );
    expect(result).toContainEqual({ env, remove: remove.uuid });
    expect(result.some((c) => "update" in c && c.update.name === "KEEP")).toBe(
      false,
    );
  });
});
