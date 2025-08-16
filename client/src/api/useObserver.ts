import { ServerToClientEvents } from "common/api/websocket";
import { ErrorNames } from "common/custom-error/custom-error";
import { useEffect, useState } from "react";
import { createObserver } from "./observers";

/**
 * Create a react hook that registers an observer for a specific event.
 *
 * @param event
 * @param query
 * @param subscription
 * @param callback
 */
export function useObserver<R, K extends keyof ServerToClientEvents>(
  {
    event,
    query,
    callback,
    mergeStrategy,
  }: {
    event: K;
    query?: { [key: string]: any } | null;
    callback: (...args: Parameters<ServerToClientEvents[K]>) => R;
    mergeStrategy?: (prev: R | null, next: R) => R;
  },
  deps: any[] = []
) {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [result, setResult] = useState<R | null>(null);

  useEffect(() => {
    const { unSubscribe } = createObserver(
      event,
      query || null,
      (result) => {
        if (result.success) {
          setError(null);
          setIsRegistered(true);
        } else {
          const err = new Error(
            result.error?.message || "An unknown error occurred"
          );
          err.name = result.error?.name || ErrorNames.ObserverError;
          err.status = result.error?.status || 500;

          setError(err);
          setIsRegistered(false);
          setIsLoading(false);
        }
      },
      (...args: any[]) => {
        const res = (callback as any).apply(null, args);

        if (mergeStrategy && result) {
          setResult(mergeStrategy(result, res));
        } else {
          setResult(res);
        }

        setIsLoading(false);
      }
    );

    return unSubscribe;
  }, [event, ...deps]);

  return {
    result,
    error,
    isLoading,
    isRegistered,
  };
}
