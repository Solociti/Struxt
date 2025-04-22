import "dotenv/config";

import { db_public_site_stats } from "common/models/database";
import { ProjectModel } from "common/models/projects/ProjectModel";
import geoip from "geoip-lite";
import ip from "ip";
import { UAParser } from "ua-parser-js";
import { isAIBot, isBot } from "ua-parser-js/helpers";
import { getCollection } from "./database/mongodb";
import { knex } from "./utils/database";

const VM_URL = "http://victoriametrics:8428/api/v1/import/prometheus";

type statRow = db_public_site_stats & { projectId: string };

async function processBatch(offset: number) {
  const rows: statRow[] = await knex
    .table("public_site_stats")
    .select("*")
    .limit(1000)
    .offset(offset)
    .orderBy("created_at", "asc");

  // convert the site_id to the new format
  for (const row of rows) {
    if (row.site_id) {
      const projectId = await getUpdatedProjectId(row.site_id);
      row.projectId = projectId;
    } else {
      row.projectId = "";
    }
  }

  return rows;
}

const cachedProjectIds: Record<string, string> = {};

async function getUpdatedProjectId(oldId: number | string) {
  if (cachedProjectIds[oldId]) {
    return cachedProjectIds[oldId];
  }

  const collection = await getCollection<ProjectModel>("projects");

  const doc = await collection.findOne({
    oldId: oldId.toString(),
  });
  if (!doc) {
    throw new Error(`Project with id ${oldId} not found`);
  }

  cachedProjectIds[oldId] = doc.projectId as string;

  return doc.projectId as string;
}

function groupByMinute(records: statRow[]) {
  const grouped: Record<string, statRow[]> = {};

  for (const record of records) {
    const date = new Date(record.created_at);
    date.setSeconds(0, 0);

    const unixTimestamp = date.getTime();

    if (!grouped[unixTimestamp]) {
      grouped[unixTimestamp] = [] as statRow[];
    }
    grouped[unixTimestamp].push(record);
  }

  return grouped;
}

function parseUserAgent(userAgent: string) {
  const ua = UAParser(userAgent);

  let clientType = "browser";
  if (userAgent && isBot(userAgent)) {
    clientType = "bot";
  } else if (userAgent && isAIBot(userAgent)) {
    clientType = "ai-bot";
  }
  if (ua.device && ua.device.type) {
    clientType = ua.device.type;
  }

  return {
    os: ua.os.name || "unknown",
    browser: ua.browser.name || "unknown",
    clientType: clientType,
  };
}

function getGeoLocation(ipAddr: string) {
  const geoData = geoip.lookup(ipAddr);
  const fallback = ip.isPrivate(ipAddr) ? "local-ip" : "unknown";

  return {
    country: geoData?.country || fallback,
    region: geoData?.region || fallback,
    city: geoData?.city || fallback,
  };
}

function generateMetrics(groupedRecords: Record<string, statRow[]>) {
  let promMetrics = "";

  for (const [timestamp, records] of Object.entries(groupedRecords)) {
    // Group by metrics
    const requestMetrics: Record<string, number> = {};
    const deviceMetrics: Record<string, number> = {};
    const geoMetrics: Record<string, number> = {};

    records.forEach((record) => {
      const projectEnv = record.hostname.includes("struxt.solociti.com")
        ? "staging"
        : "production";

      // Request counter metrics
      const requestKey = `${record.projectId}:${projectEnv}:${record.path}:${record.method}:${record.status}`;
      requestMetrics[requestKey] = (requestMetrics[requestKey] || 0) + 1;

      // Device metrics
      const ua = parseUserAgent(record.user_agent);
      const deviceKey = `${record.projectId}:${projectEnv}:${ua.os}:${ua.browser}:${ua.clientType}`;
      deviceMetrics[deviceKey] = (deviceMetrics[deviceKey] || 0) + 1;

      // Geolocation metrics
      const geo = getGeoLocation(record.ip);
      const geoKey = `${record.projectId}:${projectEnv}:${geo.country}:${geo.region}:${geo.city}`;
      geoMetrics[geoKey] = (geoMetrics[geoKey] || 0) + 1;
    });

    // Generate request counter metrics
    for (const [key, count] of Object.entries(requestMetrics)) {
      const [project_id, projectEnv, path, method, status] = key.split(":");
      promMetrics += `struxt_site_requests{project_id="${project_id}",project_env="${projectEnv}",path="${path}",method="${method}",status="${status}"} ${count} ${timestamp}\n`;
    }

    // Generate device metrics
    for (const [key, count] of Object.entries(deviceMetrics)) {
      const [project_id, projectEnv, os, browser, client_type] = key.split(":");
      promMetrics += `struxt_site_requests_devices{project_id="${project_id}",project_env="${projectEnv}",os="${os}",browser="${browser}",client_type="${client_type}"} ${count} ${timestamp}\n`;
    }

    // Generate geolocation metrics
    for (const [key, count] of Object.entries(geoMetrics)) {
      const [project_id, projectEnv, country, region, city] = key.split(":");
      promMetrics += `struxt_site_requests_geolocation{project_id="${project_id}",project_env="${projectEnv}",country="${country}",region="${region}",city="${city}"} ${count} ${timestamp}\n`;
    }
  }

  return promMetrics;
}

async function sendToVictoriaMetrics(metrics: string) {
  if (!metrics) return;

  try {
    await fetch(VM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: metrics,
    });

    console.log(
      `Successfully sent ${
        metrics.split("\n").length - 1
      } metrics to VictoriaMetrics`
    );
  } catch (error: any) {
    console.error(
      "Error sending metrics to VictoriaMetrics:",
      error.name,
      error.message
    );
  }
}

async function migrateData() {
  let offset = 0;
  let hasMoreRecords = true;

  console.log("Starting migration...");

  // Process in batches to avoid memory issues
  while (hasMoreRecords) {
    const records = await processBatch(offset);

    if (records.length === 0) {
      hasMoreRecords = false;
      break;
    }

    const groupedRecords = groupByMinute(records);
    const metrics = generateMetrics(groupedRecords);
    await sendToVictoriaMetrics(metrics);

    offset += records.length;

    if (records.length < 1000) {
      hasMoreRecords = false;
    }

    console.log(`Processed ${offset} records so far`);
  }

  console.log(`Migration complete. Total records processed: ${offset}`);

  knex.destroy();
  process.exit(0);
}

// Execute the migration
migrateData().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
