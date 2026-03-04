import { describe, expect, test } from "vitest";
import { ProjectKeyModel, ProjectSecretModel } from "./ProjectSecret";

describe("ProjectKey", () => {
  test("should initialize with default values", () => {
    const model = new ProjectKeyModel();

    expect(model.projectId).toBe("");
    expect(model.siteEnv).toBe("staging");
    expect(model.publicKeyHex).toBe("");
    expect(model.encryptedPrivateKeyHex).toBe("");
  });

  test("should initialize with provided data", () => {
    const model = new ProjectKeyModel({
      projectId: "proj-1",
      siteEnv: "production",
      publicKeyHex: "abcd",
      encryptedPrivateKeyHex: "efgh",
    });

    expect(model.projectId).toBe("proj-1");
    expect(model.siteEnv).toBe("production");
    expect(model.publicKeyHex).toBe("abcd");
    expect(model.encryptedPrivateKeyHex).toBe("efgh");
  });

  test("should partially update fields", () => {
    const model = new ProjectKeyModel({ projectId: "proj-1" });
    model.update({ publicKeyHex: "newkey" });

    expect(model.projectId).toBe("proj-1");
    expect(model.publicKeyHex).toBe("newkey");
  });

  test("should clone as a separate instance with equal values", () => {
    const model = new ProjectKeyModel({
      projectId: "proj-1",
      publicKeyHex: "abcd",
    });
    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(ProjectKeyModel);
    expect(cloned).not.toBe(model);
    expect(cloned.projectId).toBe(model.projectId);
    expect(cloned.publicKeyHex).toBe(model.publicKeyHex);
  });

  test("mutating a clone should not affect the original", () => {
    const model = new ProjectKeyModel({ projectId: "proj-1" });
    const cloned = model.clone();
    cloned.update({ projectId: "proj-2" });

    expect(model.projectId).toBe("proj-1");
    expect(cloned.projectId).toBe("proj-2");
  });
});

describe("ProjectSecret", () => {
  test("should initialize with default values", () => {
    const model = new ProjectSecretModel();

    expect(model.projectId).toBe("");
    expect(model.siteEnv).toBe("staging");
    expect(model.key).toBe("");
    expect(model.ephemeralPublicKeyHex).toBe("");
    expect(model.encryptedValueHex).toBe("");
  });

  test("should initialize with provided data", () => {
    const model = new ProjectSecretModel({
      projectId: "proj-1",
      siteEnv: "production",
      key: "DATABASE_URL",
      ephemeralPublicKeyHex: "ephem",
      encryptedValueHex: "cipher",
    });

    expect(model.projectId).toBe("proj-1");
    expect(model.siteEnv).toBe("production");
    expect(model.key).toBe("DATABASE_URL");
    expect(model.ephemeralPublicKeyHex).toBe("ephem");
    expect(model.encryptedValueHex).toBe("cipher");
  });

  test("should partially update fields", () => {
    const model = new ProjectSecretModel({
      projectId: "proj-1",
      key: "API_KEY",
    });
    model.update({ encryptedValueHex: "newcipher" });

    expect(model.key).toBe("API_KEY");
    expect(model.encryptedValueHex).toBe("newcipher");
  });

  test("should clone as a separate instance with equal values", () => {
    const model = new ProjectSecretModel({
      projectId: "proj-1",
      key: "API_KEY",
    });
    const cloned = model.clone();

    expect(cloned).toBeInstanceOf(ProjectSecretModel);
    expect(cloned).not.toBe(model);
    expect(cloned.projectId).toBe(model.projectId);
    expect(cloned.key).toBe(model.key);
  });

  test("mutating a clone should not affect the original", () => {
    const model = new ProjectSecretModel({ key: "API_KEY" });
    const cloned = model.clone();
    cloned.update({ key: "OTHER_KEY" });

    expect(model.key).toBe("API_KEY");
    expect(cloned.key).toBe("OTHER_KEY");
  });
});
