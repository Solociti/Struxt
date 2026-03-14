import { useRef, useState } from "react";
import { addToastError } from "./ErrorSnackBar";

interface UseAsyncCallbackOptions {
  /**
   * Defaults to false.
   */
  toastError?: boolean;
}

/**
 * Setup a callback to be used in a component
 *
 * @param callback
 * @returns
 */
export function useAsyncCallback<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  options?: Partial<UseAsyncCallbackOptions>,
): {
  callback: (...args: Parameters<T>) => Promise<ReturnType<T> | undefined>;
  result: Awaited<ReturnType<T>> | null;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<T>> | null>(null);

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const asyncCallback = useRef(async (...args: Parameters<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await callbackRef.current(...args);
      setResult(response);
      return response;
    } catch (err) {
      setError(err as Error);

      if (optionsRef.current?.toastError) {
        addToastError(err as Error);
      }
    } finally {
      setIsLoading(false);
    }
  });

  const reset = useRef(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  });

  return {
    callback: asyncCallback.current,
    result,
    isLoading,
    error,
    reset: reset.current,
  };
}

/**
 * Setup a debounced callback to be used in a component
 *
 * @param callback
 * @param delayMs
 * @param options
 * @returns
 */
export function useAsyncDebouncedCallback<
  T extends (...args: any[]) => Promise<any>,
>(
  callback: T,
  delayMs: number,
  options?: Partial<UseAsyncCallbackOptions>,
): {
  callback: (...args: Parameters<T>) => void;
  result: Awaited<ReturnType<T>> | null;
  isActive: boolean;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
} {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<T>> | null>(null);

  let timeoutId = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = (...args: Parameters<T>) => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    // set the active state and reset error as soon as the callback is invoked
    setError(null);
    setIsActive(true);

    timeoutId.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await callback(...args);
        setResult(response);
      } catch (err) {
        setError(err as Error);

        if (options?.toastError) {
          addToastError(err as Error);
        }
      } finally {
        setIsActive(false);
        setIsLoading(false);
      }
    }, delayMs);
  };

  const reset = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    setIsLoading(false);
    setError(null);
    setResult(null);
    setIsActive(false);
  };

  return {
    callback: debouncedCallback,
    result,
    isActive,
    isLoading,
    error,
    reset,
  };
}
