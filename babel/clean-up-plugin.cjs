const fs = require("fs");
const path = require("path");

/**
 * This custom plugin is needed instead of --delete-dir-on-start
 * because that option deletes the entire directory instead of
 * just the contents.
 */

module.exports = function cleanUpPlugin() {
  let cleaned = false; // Ensure cleanup runs only once

  return {
    pre(state) {
      if (cleaned) {
        return;
      }

      const fileName = state.opts.filename;

      let outputDir = "";
      if (fileName.startsWith("/app/server/")) {
        outputDir = "/app/dist-server/server/";
      } else if (fileName.startsWith("/app/common/")) {
        outputDir = "/app/dist-server/common/";
      }

      if (!outputDir) {
        console.warn(
          "[clean-up-plugin] No outputDir option provided. Skipping cleanup."
        );
        cleaned = true; // Mark as "done" even if skipped
        return;
      }

      try {
        if (fs.existsSync(outputDir)) {
          console.log(
            `[clean-up-plugin] Clearing contents of directory: ${outputDir}`
          );

          // Read directory contents
          const files = fs.readdirSync(outputDir);
          for (const file of files) {
            const currentPath = path.join(outputDir, file);
            // Remove each file or directory within the output directory
            fs.rmSync(currentPath, { recursive: true, force: true });
          }
          // Directory itself is not removed, just its contents
        } else {
          // If the directory doesn't exist, create it
          fs.mkdirSync(outputDir, { recursive: true });
          console.log(`[clean-up-plugin] Created directory: ${outputDir}`);
        }
      } catch (err) {
        console.error(
          `[clean-up-plugin] Error cleaning directory ${outputDir}:`,
          err
        );
        // Optionally re-throw or handle the error appropriately
        // throw err;
      }

      cleaned = true; // Mark cleanup as done
    },
    visitor: {
      // No file-specific transformations needed for this plugin
    },
  };
};
