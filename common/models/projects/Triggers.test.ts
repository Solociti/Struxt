import { describe, expect, test } from "vitest";
import { createCronTrigger, createHttpTrigger } from "./Triggers";

describe("createHttpTrigger", () => {
  test("should setup default values", () => {
    const trigger = createHttpTrigger();

    expect(trigger).toEqual({
      endpoint: "",
      method: "GET",
      assetId: "",
      handler: "",
      environmentId: "",
    });
  });

  test("should merge partial values", () => {
    const trigger = createHttpTrigger({
      endpoint: "/api/run",
      method: "POST",
      handler: "runTask",
    });

    expect(trigger).toEqual({
      endpoint: "/api/run",
      method: "POST",
      assetId: "",
      handler: "runTask",
      environmentId: "",
    });
  });
});

describe("createCronTrigger", () => {
  test("should setup default values", () => {
    const trigger = createCronTrigger();

    expect(trigger).toEqual({
      cronExpression: "",
      assetId: "",
      handler: "",
      environmentId: "",
    });
  });

  test("should merge partial values", () => {
    const trigger = createCronTrigger({
      cronExpression: "*/5 * * * *",
      assetId: "asset-1",
    });

    expect(trigger).toEqual({
      cronExpression: "*/5 * * * *",
      assetId: "asset-1",
      handler: "",
      environmentId: "",
    });
  });
});
