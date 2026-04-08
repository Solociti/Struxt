import { beforeEach, describe, expect, it, vi } from "vitest";
import { fissionResourceNamespace } from "server/routines/fission/types";
import { getK8sApi } from "server/routines/kubeSetup";
import { deleteConfigMap, upsertConfigMap } from "./configMap";

vi.mock("server/routines/kubeSetup", () => ({
  getK8sApi: vi.fn(),
}));

describe("configMap helpers", () => {
  const createNamespacedConfigMap = vi.fn();
  const replaceNamespacedConfigMap = vi.fn();
  const deleteNamespacedConfigMap = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getK8sApi).mockResolvedValue({
      core: {
        createNamespacedConfigMap,
        replaceNamespacedConfigMap,
        deleteNamespacedConfigMap,
      } as any,
      custom: {} as any,
      kc: {} as any,
    });
  });

  it("creates a configmap when it does not exist", async () => {
    createNamespacedConfigMap.mockResolvedValue({
      metadata: { name: "routine-vars" },
    });

    await upsertConfigMap({
      name: "routine-vars",
      data: { API_URL: "https://example.com" },
    });

    expect(createNamespacedConfigMap).toHaveBeenCalledWith({
      namespace: fissionResourceNamespace,
      body: expect.objectContaining({
        metadata: expect.objectContaining({ name: "routine-vars" }),
        data: { API_URL: "https://example.com" },
      }),
    });
    expect(replaceNamespacedConfigMap).not.toHaveBeenCalled();
  });

  it("replaces a configmap when create hits a conflict", async () => {
    createNamespacedConfigMap.mockRejectedValue({ code: 409 });
    replaceNamespacedConfigMap.mockResolvedValue({
      metadata: { name: "routine-vars" },
    });

    await upsertConfigMap({
      name: "routine-vars",
      namespace: "custom",
      data: { FEATURE_FLAG: "true" },
    });

    expect(replaceNamespacedConfigMap).toHaveBeenCalledWith({
      name: "routine-vars",
      namespace: "custom",
      body: expect.objectContaining({
        metadata: expect.objectContaining({
          name: "routine-vars",
          namespace: "custom",
        }),
        data: { FEATURE_FLAG: "true" },
      }),
    });
  });

  it("ignores not found during delete when requested", async () => {
    deleteNamespacedConfigMap.mockRejectedValue({ statusCode: 404 });

    await expect(deleteConfigMap("routine-vars")).resolves.toBeUndefined();
  });

  it("throws not found during delete when ignoreNotFound is false", async () => {
    deleteNamespacedConfigMap.mockRejectedValue({ statusCode: 404 });

    await expect(
      deleteConfigMap("routine-vars", fissionResourceNamespace, false),
    ).rejects.toEqual({ statusCode: 404 });
  });
});
