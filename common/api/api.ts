/**
 * The base API interface
 *
 * extend this interface to create a new API
 */
export interface Api {
  Endpoint: string;

  UrlParams: Record<string, string>;

  GetQuery: object;
  GetResponse: object;

  PostBody: object;
  PostResponse: object;

  PutBody: object;
  PutResponse: object;

  DeleteQuery: object;
  DeleteResponse: object;
}
