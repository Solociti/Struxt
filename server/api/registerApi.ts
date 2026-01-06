import { Api } from "common/api/api";
import { CurrentUserModel } from "common/models/user/CurrentUserModel";
import { PermType } from "common/models/user/Roles";
import express from "express";
import { protectEndpoint } from "server/auth/protectEndpoint";
import { sanitizeObject, SanitizeObjOptions } from "server/utils/sanitize";
import { userFromReq } from "./auth/userFromReq";

export const router = express.Router();

interface GetCallbackParam<T extends Api> {
  req: express.Request;
  res: express.Response;

  user: CurrentUserModel;

  params: T["UrlParams"];

  query: T["GetQuery"];
}

interface PostCallbackParam<T extends Api> {
  req: express.Request;
  res: express.Response;

  user: CurrentUserModel;

  params: T["UrlParams"];

  body: T["PostBody"];
}

interface PutCallbackParam<T extends Api> {
  req: express.Request;
  res: express.Response;

  user: CurrentUserModel;

  params: T["UrlParams"];

  body: T["PutBody"];
}

interface DeleteCallbackParam<T extends Api> {
  req: express.Request;
  res: express.Response;

  user: CurrentUserModel;

  params: T["UrlParams"];

  query: T["DeleteQuery"];
}

interface RegisterApiOptions {
  querySanitization?: Record<string, SanitizeObjOptions>;
  bodySanitization?: Record<string, SanitizeObjOptions>;
}

/**
 * Register an API endpoint with the server
 *
 * @param api
 * @returns
 */
export function registerApi<T extends Api>(
  api: T["Endpoint"],
  options?: RegisterApiOptions
) {
  const opt: Required<RegisterApiOptions> = Object.assign(
    {
      querySanitization: {
        skipSanitize: false,
      },
      bodySanitization: {
        skipSanitize: false,
      },
    },
    options
  );

  const handlers = {
    /**
     * Register a GET handler for the API
     *
     * @param roles
     * @param callback
     * @returns
     */
    get(
      roles: PermType[],
      callback: (param: GetCallbackParam<T>) => Promise<T["GetResponse"]>,
      options?: RegisterApiOptions
    ) {
      const getOptions = Object.assign({}, opt, options);

      router.get(
        api,
        protectEndpoint(roles, {
          onFail: "json",
        }),
        async (req, res) => {
          // check if the user has the correct role
          const user = await userFromReq(req);

          const param: GetCallbackParam<T> = {
            req,
            res,
            user,
            params: sanitizeObject(req.params),
            query: sanitizeObject(
              req.query,
              getOptions.querySanitization
            ) as T["GetQuery"],
          };

          // process the request.
          const response = await callback(param);

          if (response) {
            res.status(200).json(response);
          }
        }
      );

      return handlers;
    },
    /**
     * Register a POST handler for the API
     *
     * @param roles
     * @param callback
     */
    post(
      roles: PermType[],
      callback: (param: PostCallbackParam<T>) => Promise<T["PostResponse"]>,
      options?: RegisterApiOptions
    ) {
      const postOptions = Object.assign({}, opt, options);

      router.post(
        api,
        protectEndpoint(roles, { onFail: "json" }),
        async (req, res) => {
          // check if the user has the correct role
          const user = await userFromReq(req);

          const param: PostCallbackParam<T> = {
            req,
            res,
            user,
            params: sanitizeObject(req.params),
            body: sanitizeObject(req.body, postOptions.bodySanitization),
          };

          // process the request.
          const response = await callback(param);

          if (response) {
            res.status(200).json(response);
          }
        }
      );
      return handlers;
    },
    /**
     * Register a PUT handler for the API
     *
     * @param roles
     * @param callback
     * @returns
     */
    put(
      roles: PermType[],
      callback: (param: PutCallbackParam<T>) => Promise<T["PutResponse"]>,
      options?: RegisterApiOptions
    ) {
      const putOptions = Object.assign({}, opt, options);

      router.put(
        api,
        protectEndpoint(roles, { onFail: "json" }),
        async (req, res) => {
          // check if the user has the correct role
          const user = await userFromReq(req);

          const param: PutCallbackParam<T> = {
            req,
            res,
            user,
            params: sanitizeObject(req.params),
            body: sanitizeObject(req.body, putOptions.bodySanitization),
          };

          // process the request.
          const response = await callback(param);

          if (response) {
            res.status(200).json(response);
          }
        }
      );

      return handlers;
    },
    /**
     * Register a DELETE handler for the API
     *
     * @param roles
     * @param callback
     * @returns
     */
    delete(
      roles: PermType[],
      callback: (param: DeleteCallbackParam<T>) => Promise<T["DeleteResponse"]>,
      options?: RegisterApiOptions
    ) {
      const deleteOptions = Object.assign({}, opt, options);

      router.delete(
        api,
        protectEndpoint(roles, { onFail: "json" }),
        async (req, res) => {
          // check if the user has the correct role
          const user = await userFromReq(req);

          const param: DeleteCallbackParam<T> = {
            req,
            res,
            user,
            params: sanitizeObject(req.params),
            query: sanitizeObject(
              req.query,
              deleteOptions.querySanitization
            ) as T["DeleteQuery"],
          };

          // process the request.
          const response = await callback(param);

          if (response) {
            res.status(200).json(response);
          }
        }
      );

      return handlers;
    },
  };

  return handlers;
}
