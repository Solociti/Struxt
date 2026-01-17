/// <reference lib="webworker" />

import { getIframeContents } from "./editor/components/canvasTweaks";

declare const self: ServiceWorkerGlobalScope;

const clientMap = new Map<string, { projectId: string; context: string }>();

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_PROJECT") {
    const { projectId, context } = event.data;
    if (projectId && context && event.source) {
      // @ts-expect-error - event.source.id exists on ExtendableMessageEvent source
      clientMap.set(event.source.id, { projectId, context });
    }
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === "/virtual-preview-frame") {
    const projectId = url.searchParams.get("projectId");

    if (event.clientId) {
      // register the iframe client
      clientMap.set(event.clientId, {
        projectId: projectId || "",
        context: "iframe",
      });
    }

    event.respondWith(
      new Response(getIframeContents(projectId || ""), {
        headers: { "Content-Type": "text/html" },
      })
    );
    return;
  }

  if (url.origin !== location.origin) {
    return;
  }

  const clientInfo = clientMap.get(event.clientId);
  if (!clientInfo) {
    return;
  }
  const { projectId, context } = clientInfo;

  // Context-specific rules
  let shouldRewrite = false;

  if (context === "parent") {
    if (url.pathname.startsWith("/assets/")) {
      shouldRewrite = true;
    }
  } else if (context === "iframe") {
    shouldRewrite = true;
  }

  if (shouldRewrite) {
    if (url.pathname.startsWith(`/assets/${projectId}/`)) {
      return;
    }

    const newPath = `/assets/${projectId}/public${url.pathname}`;
    const newUrl = new URL(newPath, url.origin).toString();

    event.respondWith(fetch(newUrl));
  }
});
