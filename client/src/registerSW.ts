/**
 * Register the service worker
 */
export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(
      import.meta.env.MODE === "production"
        ? "/service-worker.js"
        : "/dev-sw.js?dev-sw",
      {
        type: import.meta.env.MODE === "production" ? "classic" : "module",
        scope: "/",
      }
    );
  }
}
