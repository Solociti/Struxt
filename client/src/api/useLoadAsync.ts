import { useCallback, useEffect, useState } from "react";

/**
 * Used to load data asynchronously
 *
 * @param callback
 * @param deps
 * @returns
 */
export function useLoadAsync<Response extends object>(
  callback: () => Promise<Response | null>,
  deps: any[],
): {
  response: Response | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
} {
  // Create the state variables
  const [response, setResponse] = useState<Response | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create an async function to load the document
  const loadResponse = useCallback(async () => {
    // Set the loading state to true
    setIsLoading(true);

    try {
      // Call the callback function to load the document
      const doc = await callback();

      // Set the document state
      setResponse(doc);
      setError(null);
    } catch (err) {
      // Set the error state
      setError(err as Error);
    } finally {
      // Set the loading state to false
      setIsLoading(false);
    }
  }, deps);

  // Load the document when the component mounts
  useEffect(() => {
    // Call the loadDocument function
    loadResponse();
  }, deps);

  // Return the state variables
  return {
    response,
    isLoading,
    error,
    reload: loadResponse,
  };
}
