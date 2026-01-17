let registration: ServiceWorkerRegistration | null = null;
let registrationError: Error | null = null;
let retryCount = 0;
let isReady = false;
const MAX_RETRIES = 5;

/**
 * Check if the browser supports service workers
 */
export function isServiceWorkerSupported(): boolean {
  return "serviceWorker" in navigator;
}

/**
 * Get the registration error if any
 */
export function getRegistrationError(): Error | null {
  if (!isServiceWorkerSupported()) {
    return new Error(
      "Service Worker API is not supported in this browser. Please use a modern browser.",
    );
  }
  return registrationError;
}

/**
 * Get the current registration state
 */
export function getRegistrationState(): {
  isRegistering: boolean;
  isReady: boolean;
  retryCount: number;
} {
  return {
    isRegistering:
      registration === null &&
      registrationError === null &&
      isServiceWorkerSupported(),
    isReady,
    retryCount,
  };
}

/**
 * Wait for the service worker to be ready
 */
export async function waitForServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  if (isReady) {
    return true;
  }

  if (registrationError) {
    return false;
  }

  try {
    await navigator.serviceWorker.ready;
    isReady = true;
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Register the service worker with retry logic
 */
async function registerServiceWorker(attempt: number = 0): Promise<void> {
  if (!isServiceWorkerSupported()) {
    registrationError = new Error(
      "Service Worker API is not supported in this browser. Please use a modern browser.",
    );
    return;
  }

  try {
    registration = await navigator.serviceWorker.register(
      import.meta.env.MODE === "production" ? "/sw.js" : "/dev-sw.js?dev-sw",
      {
        type: import.meta.env.MODE === "production" ? "classic" : "module",
        scope: "/",
      },
    );

    await navigator.serviceWorker.ready;
    isReady = true;
  } catch (err) {
    const error = err as Error;

    const shouldRetry =
      attempt < MAX_RETRIES &&
      (error.name === "NetworkError" ||
        error.message.includes("fetch") ||
        error.message.includes("network"));

    if (shouldRetry) {
      retryCount = attempt + 1;
      const delayMs = Math.pow(2, attempt) * 1000;

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return registerServiceWorker(attempt + 1);
    } else {
      registrationError = error;
    }
  }
}

registerServiceWorker();
