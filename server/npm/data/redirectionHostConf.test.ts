import { ProjectEnvSettings } from "common/models/projects/Environment";
import { describe, expect, test } from "vitest";
import {
  createRedirectionHostConf,
  updateRedirectionHostConf,
} from "./redirectionHostConf";

describe("Redirection Hosts", () => {
  describe("createRedirectionHostConf", () => {
    test("should create a default redirection host configuration", () => {
      const conf = createRedirectionHostConf();

      expect(conf).toEqual({
        domain_names: [],
        forward_scheme: "https",
        forward_domain_name: "",
        forward_http_code: 302,
        preserve_path: true,

        block_exploits: true,
        http2_support: true,

        certificate_id: 0,
        ssl_forced: true,
        hsts_enabled: true,
        hsts_subdomains: false,

        advanced_config: "",
        meta: {},
      });
    });
  });

  describe("updateRedirectionHost", () => {
    test("should update the redirection host configuration", () => {
      const conf = createRedirectionHostConf();
      const domains = ["example.com", "www.example.com"];
      const envSettings = {
        forceSsl: true,
        hsts: true,
        proxy: {
          certificateId: 123,
        },
      } as ProjectEnvSettings;
      const primaryDomain = "primary.example.com";

      const updatedConf = updateRedirectionHostConf(
        conf,
        domains,
        envSettings,
        primaryDomain
      );

      expect(updatedConf).toEqual({
        domain_names: ["example.com", "www.example.com"],
        forward_scheme: "https",
        forward_domain_name: "primary.example.com",
        forward_http_code: 302,
        preserve_path: true,
        block_exploits: true,
        http2_support: true,
        certificate_id: 123,
        ssl_forced: true,
        hsts_enabled: true,
        hsts_subdomains: false,
        advanced_config: "",
        meta: {},
      });
    });

    test("should handle non-SSL configuration", () => {
      const conf = createRedirectionHostConf();
      const domains = ["example.org"];
      const envSettings = {
        forceSsl: false,
        hsts: false,
        proxy: {
          certificateId: 456,
        },
      } as ProjectEnvSettings;
      const primaryDomain = "primary.example.org";

      const updatedConf = updateRedirectionHostConf(
        conf,
        domains,
        envSettings,
        primaryDomain
      );

      expect(updatedConf.forward_scheme).toBe("http");
      expect(updatedConf.ssl_forced).toBe(false);
      expect(updatedConf.hsts_enabled).toBe(false);
      expect(updatedConf.certificate_id).toBe(456);
    });
  });
});
