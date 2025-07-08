import { describe, expect, test } from "vitest";
import { createDefaultProxyHostConf } from "./createProxyHostConf";

describe("createProxyHostConf", () => {
  test("should create a default proxy host configuration", () => {
    const conf = createDefaultProxyHostConf();

    expect(conf).toEqual({
      domain_names: [],
      forward_scheme: "http",
      forward_host: "web-host",
      forward_port: 3000,
      certificate_id: 0,
      ssl_forced: true,
      hsts_enabled: true,
      hsts_subdomains: false,
      http2_support: true,
      block_exploits: true,
      caching_enabled: false,
      allow_websocket_upgrade: false,
      access_list_id: 0,
      advanced_config: "# -- End of struxt config --",
      enabled: true,
      meta: {},
      locations: [
        {
          path: "/",
          advanced_config:
            '# Redirect index.html to root path while preserving query parameters\nif ($request_uri ~* "^(.*)/index\\.html(.*)$") {\nreturn 301 $1/$2;\n}\n# -- End of struxt config --',
          forward_scheme: "http",
          forward_host: "web-host/sites/:projectId/:projectEnv/:publishId/",
          forward_port: 3000,
        },
        {
          path: "/submit",
          advanced_config:
            "proxy_request_buffering off;\nclient_max_body_size 50M;\n# -- End of struxt config --",
          forward_scheme: "http",
          forward_host: "editor-api/forms/submit/:projectId/:projectEnv/",
          forward_port: 3000,
        },
      ],
    });
  });
});
