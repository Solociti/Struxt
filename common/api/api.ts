/**
 * The base API interface
 *
 * extend this interface to create a new API
 */
export interface Api {
  Endpoint: string;
  EndpointParts: string[];

  UrlParams: Record<string, string>;

  GetQuery: Record<string, string>;
  GetResponse: object;

  PostBody: object;
  PostResponse: object;

  PutBody: object;
  PutResponse: object;

  DeleteQuery: Record<string, string>;
  DeleteResponse: object;
}
