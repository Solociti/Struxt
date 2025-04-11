import { customError } from "common/custom-error/custom-error";
import { db_domains } from "common/models/database";
import { DomainModel } from "common/models/projects/Domains";
import { knex } from "server/utils/database";

export async function getDomain(domainId: number) {
  const row: db_domains = await knex
    .table("domains")
    .where({ id: domainId })
    .first();
  if (!row) {
    throw customError(404, "Domain not found");
  }

  return new DomainModel({
    id: row.id,
    siteId: row.site_id,
    domain: row.domain,
    isPrimary: Boolean(row.is_primary),
    enabled: Boolean(row.enabled),
    updated: {
      timestamp: row.updated_at,
      userId: row.updated_by || "",
      displayName: "",
      // TODO: add display name
    },
    created: {
      timestamp: row.created_at,
    },
  });
}
