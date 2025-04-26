import { HTTPStatus } from "common/custom-error/custom-error";

export interface NpmErrorResponse {
  error: { code: HTTPStatus; message: string };
}

export interface NpmTokenResponse {
  expires: string;
  token: string;
}

export type NpmProxyHostsResponse = ProxyHostResponse[];

/**
 * The proxy host object
 */
export interface ProxyHostUpdate {
  domain_names: string[];

  forward_scheme: string;
  forward_host: string;
  forward_port: number;

  certificate_id: number;
  ssl_forced: boolean;
  hsts_enabled: boolean;
  hsts_subdomains: boolean;

  http2_support: boolean;
  block_exploits: boolean;
  caching_enabled: boolean;
  allow_websocket_upgrade: boolean;

  access_list_id: number;

  advanced_config: string;
  enabled: boolean;

  meta: {};

  locations: Location[];
}

export interface ProxyHostResponse extends Omit<ProxyHostUpdate, "meta"> {
  id: number;
  created_on: string;
  modified_on: string;

  owner_user_id: number;

  meta: Meta;
}

export interface Location {
  path: string;
  advanced_config: string;
  forward_scheme: string;
  forward_host: string;
  forward_port: number;
}

export interface Meta {
  letsencrypt_agree: boolean;
  dns_challenge: boolean;
  nginx_online: boolean;
  nginx_err: null;

  letsencrypt_email?: string;
}

export interface RedirectHostUpdate {
  domain_names: string[];

  forward_http_code: number;
  forward_scheme: string;
  forward_domain_name: string;
  preserve_path: boolean;

  certificate_id: number;
  ssl_forced: boolean;
  hsts_enabled: boolean;
  hsts_subdomains: boolean;

  http2_support: boolean;
  block_exploits: boolean;

  advanced_config: string;
  meta: {};
}

export interface RedirectHostResponse extends Omit<RedirectHostUpdate, "meta"> {
  id: number;
  created_on: string;
  modified_on: string;
  owner_user_id: number;

  meta: Meta;

  enabled: boolean;
}

export interface CertificateUpdate {
  provider: "letsencrypt" | "other";
  nice_name: string;

  domain_names: string[];

  meta: {
    certificate?: string;
    certificate_key?: string;

    dns_challenge: boolean;
    dns_provider?: string;
    dns_provider_credentials?: string;

    letsencrypt_agree: boolean;
    letsencrypt_certificate?: {};
    letsencrypt_email: string;

    propagation_seconds: number;
  };
}

export interface CertificateResponse extends Omit<CertificateUpdate, "meta"> {
  id: number;
  created_on: string;
  modified_on: string;

  owner_user_id: number;

  expires_on: string;

  meta: Meta;
}
