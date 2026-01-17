import { useEffect, useState } from "react";
import {
  getRegistrationError,
  isServiceWorkerSupported,
  waitForServiceWorker,
} from "./registerSW";

/**
 * React hook to get the current service worker state
 */
export function useServiceWorker(): {
  isReady: boolean;
  error: Error | null;
  isRegistering: boolean;
} {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isRegistering, setIsRegistering] = useState(true);

  useEffect(() => {
    const initServiceWorker = async () => {
      const ready = await waitForServiceWorker();
      const err = getRegistrationError();

      setIsReady(ready);
      setError(err);
      setIsRegistering(false);
    };

    initServiceWorker();

    if (!isServiceWorkerSupported()) {
      return;
    }

    const controllerChangeListener = () => {
      setIsReady(true);
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      controllerChangeListener
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controllerChangeListener
      );
    };
  }, []);

  return { isReady, error, isRegistering };
}
