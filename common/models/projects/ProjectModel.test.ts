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
      context: [],
      staging: {
        forceSsl: true,
        hsts: true,
        domains: [],
        proxy: {
          certificateId: 0,
          hostId: 0,
          redirectId: 0,
        },
        variables: [],
      },
      production: {
        forceSsl: true,
        hsts: true,
        domains: [],
        proxy: {
          certificateId: 0,
          hostId: 0,
          redirectId: 0,
        },
        variables: [],
      },
      featureFlags: {
        aiPilot: {
          enabled: false,
          settings: {
            monthlyAllowance: 0,
          },
        },
        routines: {
          enabled: false,
          environments: [],
        },
      },
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
            created: {
              date: 12345,
            },
          },
        ],
        variables: [
          {
            uuid: "var-1",
            name: "API_KEY",
            value: "abc123",
          },
        ],
      },
      production: {
        domains: [
          {
            domain: "example.com",
            created: {
              date: 12345,
            },
          },
        ],
      },
      // editor data should not get transformed
      editorData: {
        assets: [{}],
      },
      featureFlags: {
        routines: {
          enabled: true,
          environments: [
            {
              uuid: "env1",
              files: ["**/*.js"],
              ignore: ["**/**.test.js"],
            },
            {
              uuid: "env2",
            },
          ],
        },
      },
    });

    expect(model).toEqual({
      projectId: "",
      name: "",
      description: "",
      storage: { maxBytes: 0 },
      editorData: { assets: [{}] },
      context: [],
      staging: {
        forceSsl: true,
        hsts: true,
        domains: [
          {
            domain: "example.com",
            dnsVerified: { active: false, date: 0 },
            created: { date: 12345, userId: "", displayName: "" },
            enabled: { active: false, date: 0, userId: "", displayName: "" },
            deleted: { active: false, date: 0, userId: "", displayName: "" },
            isPrimary: false,
          },
        ],
        proxy: {
          certificateId: 0,
          hostId: 0,
          redirectId: 0,
        },
        variables: [
          {
            uuid: "var-1",
            name: "API_KEY",
            value: "abc123",
            secretLength: 0,
            isSecret: false,
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
            created: { date: 12345, userId: "", displayName: "" },
            enabled: { active: false, date: 0, userId: "", displayName: "" },
            deleted: { active: false, date: 0, userId: "", displayName: "" },
            isPrimary: false,
          },
        ],
        proxy: {
          certificateId: 0,
          hostId: 0,
          redirectId: 0,
        },
        variables: [],
      },
      featureFlags: {
        aiPilot: {
          enabled: false,
          settings: {
            monthlyAllowance: 0,
          },
        },
        routines: {
          enabled: true,
          environments: [
            {
              uuid: "env1",
              files: ["**/*.js"],
              ignore: ["**/**.test.js"],
            },
            {
              uuid: "env2",
              files: [],
              ignore: [],
            },
          ],
        },
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
