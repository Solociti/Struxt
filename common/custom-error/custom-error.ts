export const ErrorNames = {
  AuthFailed: "Authentication Failed",
  BadRequest: "Bad Request",
  Error: "Error",
  Forbidden: "Access Denied",
  InternalServerError: "Internal Server Error",
  NotFound: "Not Found",
  ObserverError: "Observer Error",
  ProjectNotFound: "Project Not Found",
  Unauthorized: "Unauthorized",
  PaymentRequired: "Payment Required",
  ExecutionError: "Execution Error",
};

export type HTTPStatus = 400 | 401 | 402 | 403 | 404 | 500;
type ErrorNames = keyof typeof ErrorNames;

declare global {
  interface Error {
    status?: number;
    statusCode?: number;
  }
}

/**
 * Create a custom error with the provided status, message, and name.
 *
 * `400 Bad Request`
 * `401 Unauthorized`
 * `402 Payment Required`
 * `403 Forbidden`
 * `404 Not Found`
 *
 * `500 Internal Server Error`
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
      case 402:
        err.name = ErrorNames.PaymentRequired;
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

export interface StructuredError {
  name: string;
  message: string;
  status: HTTPStatus | 0;
}

/**
 * Structure an error to a standardized format to send over the network.
 *
 * @param error
 * @returns
 */
export function structureError(error: Error): StructuredError {
  return {
    name: error.name || ErrorNames.Error,
    message: error.message || "An error occurred",
    status: (error.status as HTTPStatus) || 0,
  };
}

/**
 * De-structure an error from the standardized format received over the network.
 *
 * @param error
 * @returns
 */
export function deStructureError(
  error: StructuredError,
  fallbackMessage?: string
): Error {
  const err = new Error(
    error.message || fallbackMessage || "An error occurred."
  );
  if (error.name) {
    err.name = error.name;
  }
  if (error.status) {
    err.status = error.status;
    err.statusCode = error.status;
  }

  return err;
}
