import { beforeEach, describe, expect, it, vi } from "vitest";
import { fissionResourceNamespace } from "server/routines/fission/types";
import { getK8sApi } from "server/routines/kubeSetup";
import { deleteSecret, upsertSecret } from "./secret";

vi.mock("server/routines/kubeSetup", () => ({
  getK8sApi: vi.fn(),
}));

describe("secret helpers", () => {
  const createNamespacedSecret = vi.fn();
  const replaceNamespacedSecret = vi.fn();
  const deleteNamespacedSecret = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getK8sApi).mockResolvedValue({
      core: {
        createNamespacedSecret,
        replaceNamespacedSecret,
        deleteNamespacedSecret,
      } as any,
      custom: {} as any,
      kc: {} as any,
    });
  });

  it("creates a secret when it does not exist", async () => {
    createNamespacedSecret.mockResolvedValue({
      metadata: { name: "routine-secrets" },
    });

    await upsertSecret({
      name: "routine-secrets",
      stringData: { API_KEY: "abc123" },
    });

    expect(createNamespacedSecret).toHaveBeenCalledWith({
      namespace: fissionResourceNamespace,
      body: expect.objectContaining({
        metadata: expect.objectContaining({ name: "routine-secrets" }),
        type: "Opaque",
        stringData: { API_KEY: "abc123" },
      }),
    });
    expect(replaceNamespacedSecret).not.toHaveBeenCalled();
  });

  it("replaces a secret when create hits a conflict", async () => {
    createNamespacedSecret.mockRejectedValue({ code: 409 });
    replaceNamespacedSecret.mockResolvedValue({
      metadata: { name: "routine-secrets" },
    });

    await upsertSecret({
      name: "routine-secrets",
      namespace: "custom",
      stringData: { PASSWORD: "secret" },
    });

    expect(replaceNamespacedSecret).toHaveBeenCalledWith({
      name: "routine-secrets",
      namespace: "custom",
      body: expect.objectContaining({
        metadata: expect.objectContaining({
          name: "routine-secrets",
          namespace: "custom",
        }),
        type: "Opaque",
        stringData: { PASSWORD: "secret" },
      }),
    });
  });

  it("ignores not found during delete when requested", async () => {
    deleteNamespacedSecret.mockRejectedValue({ statusCode: 404 });

    await expect(deleteSecret("routine-secrets")).resolves.toBeUndefined();
  });

  it("throws not found during delete when ignoreNotFound is false", async () => {
    deleteNamespacedSecret.mockRejectedValue({ statusCode: 404 });

    await expect(
      deleteSecret("routine-secrets", fissionResourceNamespace, false),
    ).rejects.toEqual({ statusCode: 404 });
  });
});
