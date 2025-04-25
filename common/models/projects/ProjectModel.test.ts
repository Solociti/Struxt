import { describe, expect, test } from "vitest";
import { ProjectModel } from "./ProjectModel";

describe("ProjectModel", () => {
  test("should initialize with default values", () => {
    const model = new ProjectModel();

    expect(model.created.date).to.be.closeTo(Math.floor(Date.now() / 1000), 5);
    model.created.date = 0;

    expect(model).toEqual({
      projectId: "",
      name: "",
      description: "",
      storage: { maxBytes: 0 },
      editorData: {
        assets: [],
        styles: [],
        pages: [],
        symbols: [],
        dataSources: [],
        custom: { projectType: "site", id: "" },
      },
      staging: { forceSsl: true, hsts: true, domains: [] },
      production: { forceSsl: true, hsts: true, domains: [] },
      created: { date: 0, userId: "", displayName: "" },
      updated: { date: 0, userId: "", displayName: "" },
    });
  });

  test("should initialize with provided data", () => {
    const model = new ProjectModel({
      created: {
        date: 1234,
      },
      staging: {
        domains: [
          {
            domain: "example.com",
          },
        ],
      },
      production: {
        domains: [
          {
            domain: "example.com",
          },
        ],
      },
      // editor data should not get transformed
      editorData: {
        assets: [{}],
      },
    });

    expect(model).toEqual({
      projectId: "",
      name: "",
      description: "",
      storage: { maxBytes: 0 },
      editorData: { assets: [{}] },
      staging: {
        forceSsl: true,
        hsts: true,
        domains: [
          {
            domain: "example.com",
            dnsVerified: { active: false, date: 0 },
            enabled: { active: false, date: 0, userId: "", displayName: "" },
            isPrimary: false,
          },
        ],
      },
      production: {
        forceSsl: true,
        hsts: true,
        domains: [
          {
            domain: "example.com",
            dnsVerified: { active: false, date: 0 },
            enabled: { active: false, date: 0, userId: "", displayName: "" },
            isPrimary: false,
          },
        ],
      },
      created: { date: 1234, userId: "", displayName: "" },
      updated: { date: 0, userId: "", displayName: "" },
    });
  });

  test("should clone the model correctly", () => {
    const model = new ProjectModel({});

    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(ProjectModel);
    expect(cloned).not.toBe(model);

    expect(cloned).toEqual(model);
  });
});
