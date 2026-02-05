import { useEffect, useState } from "react";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import MaterialIcon from "./MaterialIcon";

/**
 * A list of change listeners that will be called when an error is added to the snackbar.
 */
const change: (() => void)[] = [];

interface ErrorType {
  id: number;
  error: Error | { name: string; message: string };
  type: "error" | "warning" | "info";
}

/**
 * The list of errors that are currently in the snackbar.
 */
const errors: ErrorType[] = [];

let idCounter = 0;

/**
 * Add a error to the snackbar.
 *
 * @param error
 */
export function addToastError(
  error: Error | { name: string; message: string },
) {
  const id = idCounter++;
  errors.push({ id, error, type: "error" });

  // Notify all change listeners
  change.forEach((listener) => listener());
}

/**
 * Add a warning to the snackbar.
 *
 * @param name
 * @param message
 */
export function addToastWarning(name: string, message: string) {
  const id = idCounter++;
  errors.push({ id, error: { name, message }, type: "warning" });

  // Notify all change listeners
  change.forEach((listener) => listener());
}

/**
 * Add an info message to the snackbar.
 *
 * @param name
 * @param message
 */
export function addToastInfo(name: string, message: string) {
  const id = idCounter++;
  errors.push({ id, error: { name, message }, type: "info" });

  // Notify all change listeners
  change.forEach((listener) => listener());
}

/**
 * Wraps the provided function and adds a toast error if an error is thrown.
 *
 * @param func
 * @param options
 * @returns
 */
export function errorToastWrapFunction<T extends (...args: any[]) => any>(
  func: T,
  options?: {
    throwOnError?: boolean;
  },
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  options = typeof options === "object" && options ? options : {};

  return async (...args: Parameters<T>) => {
    try {
      return await func(...args);
    } catch (err) {
      addToastError(err as Error);

      if (options.throwOnError) {
        throw err;
      }

      return null;
    }
  };
}

/**
 * Remove a error from the snackbar.
 *
 * @param id
 */
function removeToastError(id: number) {
  const index = errors.findIndex((e) => e.id === id);
  if (index !== -1) {
    errors.splice(index, 1);
  }

  // Notify all change listeners
  change.forEach((listener) => listener());
}

/**
 * Add the snackbar component to the page.
 *
 * @param param0
 * @returns
 */
export function SetupErrorSnackBar({}) {
  const [list, setList] = useState<ErrorType[]>([]);

  useEffect(() => {
    const cb = () => {
      // update the list of errors
      setList([...errors]);
    };

    change.push(cb);

    // remove the callback
    return () => {
      const index = change.indexOf(cb);
      if (index !== -1) {
        change.splice(index, 1);
      }
    };
  }, []);

  return (
    <ToastContainer
      className="p-3"
      position="bottom-end"
      containerPosition="fixed"
    >
      {list.map(({ error, type, id }) => {
        const variant = (() => {
          switch (type) {
            case "error":
              return "danger";
            case "warning":
              return "warning";
            case "info":
              return "info";
            default:
              return "secondary";
          }
        })();

        const icon = (() => {
          switch (type) {
            case "error":
              return "error";
            case "warning":
              return "warning";
            case "info":
              return "info";
            default:
              return "info";
          }
        })();

        return (
          <Toast
            onClose={() => removeToastError(id)}
            show
            key={id}
            className={`border border-${variant}`}
          >
            <Toast.Header className={`text-${variant}`}>
              <MaterialIcon className="me-2">{icon}</MaterialIcon>
              <strong className="me-auto">{error.name}</strong>
            </Toast.Header>
            <Toast.Body>{error.message}</Toast.Body>
          </Toast>
        );
      })}
    </ToastContainer>
  );
}
