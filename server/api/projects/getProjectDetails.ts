import { customError } from "common/custom-error/custom-error";
import {
  db_domains,
  db_pub_form_settings,
  db_site_publish_info,
  db_sites,
} from "common/models/database";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { ProjectDetails } from "common/models/projects/ProjectDetails";
import { calcDirSize } from "../../utils/calcDirSize";
import { knex } from "../../utils/database";
import { getAssetDir } from "../../utils/uploadDir";

/**
 * Load the project details from the database
 *
 * @param projectId
 */
export async function getProjectDetails(projectId: string) {
  // load the base row
  const row: db_sites = await knex
    .table("sites")
    .where({ id: projectId })
    .first();

  if (!row) {
    throw customError(404, "Project not found.");
  }

  const stagingSettings = await knex
    .table("project_settings")
    .where({
      site_id: projectId,
      site_env: "staging",
    })
    .first();
  const productionSettings = await knex
    .table("project_settings")
    .where({
      site_id: projectId,
      site_env: "production",
    })
    .first();

  // load the domain info
  const domainRows: db_domains[] = await knex
    .table("domains")
    .where({ site_id: projectId })
    .select("*");

  // load the publish details
  const stagingPublished: db_site_publish_info = await knex
    .table("site_publish_info")
    .where({
      site_id: projectId,
      site_env: "staging",
    })
    .orderBy("published_at", "desc")
    .first("*");
  const productionPublished: db_site_publish_info = await knex
    .table("site_publish_info")
    .where({
      site_id: projectId,
      site_env: "production",
    })
    .orderBy("published_at", "desc")
    .first("*");

  // load the form information
  const formRows: db_pub_form_settings[] = await knex
    .table("pub_form_settings")
    .where({
      site_id: projectId,
    })
    .select("*");

  // count the form submissions
  const formSubmissions: (Pick<db_pub_form_settings, "form_name"> & {
    count: number;
  })[] = await knex
    .table("pub_form_submissions")
    .where({
      site_id: projectId,
      site_env: "production",
    })
    .andWhere(
      "created_at",
      ">",
      knex.raw("? - INTERVAL 30 DAY", [knex.fn.now()])
    )
    .count({ count: "form_name" })
    .select("form_name")
    .groupBy("form_name");

  // calculate the storage used
  const dir = getAssetDir(projectId);
  const storageUsed = await calcDirSize(dir);

  const details: ProjectDetails = {
    id: row.id.toString(),
    name: row.name,
    description: row.description,

    domains: domainRows.map((row) => {
      return {
        id: row.id,
        domain: row.domain,
        environment: row.site_env as EnvironmentTypes,
        isPrimary: Boolean(row.is_primary),
      };
    }),

    staging: {
      published: {
        userId: stagingPublished?.published_by || "",
        displayName: "",
        timestamp: stagingPublished?.published_at || null,
      },
      screenshot: "",

      forceSsl: stagingSettings ? Boolean(stagingSettings.force_ssl) : true,
      hsts: stagingSettings ? Boolean(stagingSettings.hsts) : true,
    },

    production: {
      published: {
        userId: productionPublished?.published_by || "",
        displayName: "",
        timestamp: productionPublished?.published_at || null,
      },
      screenshot: "",

      forceSsl: productionSettings
        ? Boolean(productionSettings.force_ssl)
        : true,
      hsts: productionSettings ? Boolean(productionSettings.hsts) : true,
    },

    storage: {
      usedBytes: storageUsed,
      maxBytes: 1024 * 1024 * 1024, // 1GB
    },

    forms: formSubmissions.map((row) => {
      const setting = formRows.find((r) => r.form_name === row.form_name);
      if (!setting) {
        return {
          formName: row.form_name,
          enabled: false,
          submissionCount: row.count,
        };
      }

      return {
        formName: row.form_name,
        enabled: setting.enabled,
        submissionCount: row.count,
      };
    }),
  };

  // get the staging user name
  if (details.staging.published.userId) {
    const stagingUser = await knex
      .table("users")
      .where({
        uuid: details.staging.published.userId,
      })
      .first();
    if (stagingUser) {
      details.staging.published.displayName = stagingUser.display_name;
    }
  }

  // get the production user name
  if (details.production.published.userId) {
    const productionUser = await knex
      .table("users")
      .where({
        uuid: details.production.published.userId,
      })
      .first();
    if (productionUser) {
      details.production.published.displayName = productionUser.display_name;
    }
  }

  return details;
}
