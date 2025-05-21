import { useState } from "react";

/**
 * Setup a callback to be used in a component
 *
 * @param callback
 * @returns
 */
export function useAsyncCallback<T extends Function>(
  callback: T
): { callback: T; isLoading: boolean; error: Error | null } {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const asyncCallback = async (...args: any[]) => {
    setIsLoading(true);
    setError(null);
    try {
      return await callback(...args);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { callback: asyncCallback as unknown as T, isLoading, error };
}
