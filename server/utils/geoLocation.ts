import { Job } from "bullmq";
import ip from "ip";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { publishMessage, subscribeToChannel } from "server/database/dragonFly";
import { execFilePromise } from "./execPromise";
import { mkDirRecursive } from "./mkDir";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// not directly importing geoip-lite here because
// it hard crashes the server if the database is not
// available. This is a workaround to allow the server
// to start without the database.
let geoip: any = null;

const importGeoipLite = async () => {
  const dataDir = process.env.GEODATADIR;
  const tmpDir = process.env.GEOTMPDIR;

  // check if the database is available
  const dbExists =
    dataDir &&
    tmpDir &&
    existsSync(dataDir) &&
    existsSync(join(dataDir, "/geoip-city.dat")) &&
    existsSync(join(dataDir, "/geoip-country.dat"));

  if (dbExists && process.env.MAXMIND_LICENSE_KEY) {
    // import geoip-lite
    const geoipLite = await import("geoip-lite");
    geoip = geoipLite.default;
  } else {
    console.log("--- GeoIP database not found. ---");
  }
};
importGeoipLite();

/**
 * Get the geoip information for an ip address
 *
 * @param ipAddr
 * @returns
 */
export function geoipLookup(ipAddr: string) {
  const geo = geoip ? geoip.lookup(ipAddr) : null;
  const fallback = ip.isPrivate(ipAddr) ? "local-ip" : "unknown";

  if (!geo) {
    return {
      country: fallback,
      region: fallback,
      city: fallback,
    };
  }

  return {
    country: geo.country || fallback,
    region: geo.region || fallback,
    city: geo.city || fallback,
  };
}

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
  if (!geoip) {
    await importGeoipLite();
  }

  if (geoip) {
    geoip.reloadData(() => {
      console.log("GeoIP database reloaded successfully.");
    });
  }
});
