import { useState } from "react";
import { addToastError } from "./ErrorSnackBar";

/**
 * Setup a callback to be used in a component
 *
 * @param callback
 * @returns
 */
export function useAsyncCallback<T extends Function>(
  callback: T,
  options?: Partial<{ toastError: boolean }>
): { callback: T; isLoading: boolean; error: Error | null; reset: () => void } {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const asyncCallback = async (...args: any[]) => {
    setIsLoading(true);
    setError(null);
    try {
      return await callback(...args);
    } catch (err) {
      setError(err as Error);

      if (options?.toastError) {
        addToastError(err as Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
  };

  return { callback: asyncCallback as unknown as T, isLoading, error, reset };
}
