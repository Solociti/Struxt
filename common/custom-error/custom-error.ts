export const ErrorNames = {
  AuthFailed: "Authentication Failed",
  BadRequest: "Bad Request",
  Error: "Error",
  Forbidden: "Access Denied",
  InternalServerError: "Internal Server Error",
  NotFound: "Not Found",
  ProjectNotFound: "Project Not Found",
  Unauthorized: "Unauthorized",
};

type HTTPStatus = 400 | 401 | 403 | 404 | 500;
type ErrorNames = keyof typeof ErrorNames;

/**
 * Create a custom error with the provided status, message, and name.
 *
 * @param status
 * @param message
 * @param name
 * @returns
 */
export function customError(
  status: HTTPStatus,
  message: string,
  name?: ErrorNames
) {
  const err = new Error(message);
  err.status = status;

  if (name) {
    err.name = name;
  } else {
    switch (status) {
      case 400:
        err.name = ErrorNames.BadRequest;
        break;
      case 401:
        err.name = ErrorNames.Unauthorized;
        break;
      case 403:
        err.name = ErrorNames.Forbidden;
        break;
      case 404:
        err.name = ErrorNames.NotFound;
        break;
      case 500:
        err.name = ErrorNames.InternalServerError;
        break;
    }
  }

  if (err.name in ErrorNames) {
    err.name = ErrorNames[err.name as ErrorNames];
  }

  return err;
}
