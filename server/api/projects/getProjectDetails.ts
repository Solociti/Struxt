import { customError } from "../../../common/custom-error/custom-error.ts";
import {
  db_domains,
  db_pub_form_settings,
  db_site_publish_info,
  db_sites,
} from "../../../common/models/database.ts";
import { EnvironmentTypes } from "../../../common/models/projects/Environment.ts";
import { ProjectDetails } from "../../../common/models/projects/ProjectDetails.ts";
import { knex } from "../../utils/database.ts";

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
    .count({ count: "form_name" })
    .select("form_name")
    .groupBy("form_name");

  const details: ProjectDetails = {
    id: row.id.toString(),
    name: row.name,
    description: row.description,

    domains: domainRows.map((row) => {
      return {
        id: row.id,
        domain: row.domain,
        environment: row.site_env as EnvironmentTypes,
        ssl: Boolean(row.ssl),
      };
    }),

    staging: {
      published: {
        userId: stagingPublished?.published_by || "",
        displayName: "", // TODO: get the display name
        timestamp: stagingPublished?.published_at || null,
      },
      screenshot: "",
    },

    production: {
      published: {
        userId: productionPublished?.published_by || "",
        displayName: "",
        timestamp: productionPublished?.published_at || null,
      },
      screenshot: "",
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

  return details;
}
