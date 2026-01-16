import { Editor } from "@grapesjs/studio-sdk-plugins/dist/types.js";

/**
 * Generate the iframe contents for the iframe canvas
 *
 * @param projectId
 * @returns
 */
export function getIframeContents(projectId: string) {
  return `
  <html>
    <head>      
      <script>
        // Check for the controller immediately
        if (navigator.serviceWorker.controller) {
          const send = () => {
            navigator.serviceWorker.controller.postMessage({
              type: "SET_PROJECT",
              projectId: "${projectId}",
              context: "iframe"
            });
          };
          send();
          // If the controller changes, send the message again
          navigator.serviceWorker.controller.addEventListener("statechange", send);
        }
      </script>
    </head>
    <body></body>
  </html>
`;
}

/**
 * GrapesJS plugin to tweak the iframe canvas
 *
 * @param projectId
 */
export function canvasTweaksPlugin(projectId: string) {
  return (editor: Editor) => {
    // This event is found at canvas/view/FrameView.ts method render() and
    // renderScripts() in the GrapesJS repo
    editor.on("frame:render", ({ el }: { el: HTMLIFrameElement }) => {
      const virtualUrl = `/virtual-preview-frame?projectId=${projectId}`;
      if (el.src === "about:blank" || el.src === "") {
        // Set a src for the service worker to intercept
        // This is a workaround for 'about:blank' iframes losing controller inheritance
        el.src = virtualUrl;
      }
    });

    if (!editor.config.canvas) {
      editor.config.canvas = {};
    }
    editor.config.canvas.frameContent = getIframeContents(projectId);
  };
}
