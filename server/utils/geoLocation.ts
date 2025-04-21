import { Job } from "bullmq";
import geoip from "geoip-lite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { publishMessage, subscribeToChannel } from "server/database/dragonFly";
import { execFilePromise } from "./execPromise";
import { mkDirRecursive } from "./mkDir";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Update the GeoIP database
 *
 * @param job
 */
export async function updateGeoIP(job: Job) {
  const dataDir = process.env.GEODATADIR;
  const tmpDir = process.env.GEOTMPDIR;
  const licenseKey = process.env.MAXMIND_LICENSE_KEY;
  if (!dataDir) {
    throw new Error("GEODATADIR is not set");
  }
  if (!tmpDir) {
    throw new Error("GEOTMPDIR is not set");
  }
  if (!licenseKey) {
    throw new Error("MAXMIND_LICENSE_KEY is not set");
  }

  await mkDirRecursive(tmpDir);
  await mkDirRecursive(dataDir);

  await job.log(`License key: ${licenseKey.substring(0, 4)}...`);

  /**
   * The path to the geoip update script
   */
  const geoIpUpdate = resolve(
    `${__dirname}/../../node_modules/geoip-lite/scripts/updatedb.js`
  );

  const result = await execFilePromise(
    `node`,
    [geoIpUpdate, `license_key=${licenseKey}`],
    {
      GEOTMPDIR: tmpDir,
      GEODATADIR: dataDir,
    }
  );

  await job.log("GeoIP database updated successfully.");

  publishMessage("geoip-update", "");

  return result;
}

// setup listeners to reload the geoip database
subscribeToChannel("geoip-update", false, async () => {
  geoip.reloadData(() => {
    console.log("GeoIP database reloaded successfully.");
  });
});
