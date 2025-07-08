import { ProxyHostUpdate } from "server/npm/types";
import { describe, expect, test, vi } from "vitest";
import {
  updateAdvancedConfig,
  updateProxyHostConf,
} from "./updateProxyHostConf";

describe("updateProxyHostConf", () => {
  describe("updateAdvancedConfig", () => {
    test("should update the advanced config string", () => {
      const currentConf = [
        "proxy_request_buffering off;",
        "# -- End of struxt config --",
        "",
        "# Custom config",
      ].join("\n");

      const defaultConf = [
        "proxy_request_buffering off;",
        "client_max_body_size 0;",
        "# -- End of struxt config --",
      ].join("\n");

      const result = updateAdvancedConfig(currentConf, defaultConf);
      const result2 = updateAdvancedConfig(result, defaultConf);

      expect(result).toBe(
        [
          "proxy_request_buffering off;",
          "client_max_body_size 0;",
          "# -- End of struxt config --",
          "",
          "# Custom config",
        ].join("\n")
      );

      expect(result2).toBe(
        [
          "proxy_request_buffering off;",
          "client_max_body_size 0;",
          "# -- End of struxt config --",
          "",
          "# Custom config",
        ].join("\n")
      );
    });
  });

  test("should update basic proxy settings", () => {
    const existingProxy: ProxyHostUpdate = {
      ssl_forced: false,
      hsts_enabled: false,
      domain_names: ["old-domain.com"],
      forward_scheme: "https",
      forward_host: "old-host",
      forward_port: 9000,
      advanced_config: [
        "# Old config",
        "# -- End of struxt config --",
        "# Custom config",
      ].join("\n"),
      certificate_id: 1,
      locations: [],
    } as any;

    const result = updateProxyHostConf(existingProxy, {
      domains: ["new-domain.com", "another-domain.com"],
      envSettings: {
        domains: [],
        forceSsl: true,
        hsts: true,
        proxy: { certificateId: 2, redirectId: 0, hostId: 0 },
      },
      projectEnv: "staging",
      projectId: "project123",
      publishId: "publish123",
      isEditorSite: false,
    });

    expect(result.ssl_forced).toBe(true);
    expect(result.hsts_enabled).toBe(true);
    expect(result.domain_names).toEqual([
      "new-domain.com",
      "another-domain.com",
    ]);
    expect(result.certificate_id).toBe(2);

    expect(result.forward_scheme).toBe("http");
    expect(result.forward_host).toBe("web-host");
    expect(result.forward_port).toBe(3000);

    expect(result.advanced_config).toBe(
      ["# -- End of struxt config --", "# Custom config"].join("\n")
    );
  });

  test("should add new location if it doesn't exist", () => {
    const existingProxy: ProxyHostUpdate = {
      ssl_forced: false,
      hsts_enabled: false,
      domain_names: [],
      forward_scheme: "",
      forward_host: "",
      forward_port: 0,
      advanced_config: "# Old config\n# -- End of struxt config --",
      certificate_id: 0,
      locations: [],
    } as any;

    const result = updateProxyHostConf(existingProxy, {
      domains: [],
      envSettings: {
        forceSsl: false,
        hsts: false,
        domains: [],
        proxy: { certificateId: 0, redirectId: 0, hostId: 0 },
      },
      projectEnv: "production",
      projectId: "project123",
      publishId: "publish123",
      isEditorSite: false,
    });

    expect(result.locations.length).toBe(2);
    expect(result.locations[0].path).toBe("/");
    expect(result.locations[1].path).toBe("/submit");
  });

  test("should update existing location if it exists", () => {
    const existingProxy: ProxyHostUpdate = {
      ssl_forced: false,
      hsts_enabled: false,
      domain_names: [],
      forward_scheme: "",
      forward_host: "",
      forward_port: 0,
      advanced_config: ["# Old config", "# -- End of struxt config --"].join(
        "\n"
      ),
      certificate_id: 0,
      locations: [
        {
          path: "/",
          forward_scheme: "https",
          forward_host: "old-service",
          forward_port: 5000,
          advanced_config: [
            "# Old API config",
            "# -- End of struxt config --",
            "# Custom API config",
          ].join("\n"),
        },
      ],
    } as any;

    const result = updateProxyHostConf(existingProxy, {
      projectId: "project123",
      projectEnv: "staging",
      envSettings: {
        forceSsl: false,
        hsts: false,
        proxy: { certificateId: 0, redirectId: 0, hostId: 0 },
        domains: [],
      },
      publishId: "publish123",
      domains: [],
      isEditorSite: false,
    });

    expect(result.locations.length).toBe(2);

    expect(result.locations[0].path).toBe("/");
    expect(result.locations[0].forward_scheme).toBe("http");
    expect(result.locations[0].forward_host).toBe(
      "web-host/sites/project123/staging/publish123/"
    );
    expect(result.locations[0].forward_port).toBe(3000);
    expect(result.locations[0].advanced_config).toBe(
      [
        "# Redirect index.html to root path while preserving query parameters",
        'if ($request_uri ~* "^(.*)/index\\.html(.*)$") {',
        "return 301 $1/$2;",
        "}",
        "# -- End of struxt config --",
        "# Custom API config",
      ].join("\n")
    );
  });

  test("should leave unrelated locations intact", () => {
    const existingProxy: ProxyHostUpdate = {
      ssl_forced: false,
      hsts_enabled: false,
      domain_names: [],
      forward_scheme: "",
      forward_host: "",
      forward_port: 0,
      advanced_config: "",
      certificate_id: 0,
      locations: [
        {
          path: "/api",
          forward_scheme: "http",
          forward_host: "api-service",
          forward_port: 5000,
          advanced_config: "",
        },
      ],
    } as any;

    const result = updateProxyHostConf(existingProxy, {
      projectId: "project123",
      projectEnv: "staging",
      envSettings: {
        forceSsl: false,
        hsts: false,
        proxy: { certificateId: 0, redirectId: 0, hostId: 0 },
        domains: [],
      },
      publishId: "publish123",
      domains: [],
      isEditorSite: false,
    });

    expect(result.locations.length).toBe(3);

    expect(result.locations[0].path).toBe("/api");
    expect(result.locations[0].forward_scheme).toBe("http");
    expect(result.locations[0].forward_port).toBe(5000);
    expect(result.locations[0].forward_host).toBe("api-service");
    expect(result.locations[0].advanced_config).toBe("");
  });
});
