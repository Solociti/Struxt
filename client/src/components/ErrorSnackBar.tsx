import ToastContainer from "react-bootstrap/ToastContainer";
import Toast from "react-bootstrap/Toast";
import { useEffect, useState } from "react";
import MaterialIcon from "./MaterialIcon";

/**
 * A list of change listeners that will be called when an error is added to the snackbar.
 */
const change: (() => void)[] = [];

interface ErrorType {
  id: number;
  error: Error;
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
export function addToastError(error: Error) {
  const id = idCounter++;
  errors.push({ id, error });

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
      {list.map(({ error, id }) => {
        return (
          <Toast
            onClose={() => removeToastError(id)}
            show
            key={id}
            className="border border-danger"
          >
            <Toast.Header className="text-danger">
              <MaterialIcon className="me-2">error</MaterialIcon>
              <strong className="me-auto">{error.name}</strong>
            </Toast.Header>
            <Toast.Body>{error.message}</Toast.Body>
          </Toast>
        );
      })}
    </ToastContainer>
  );
}
