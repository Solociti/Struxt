import {
  db_domains,
  db_project_settings,
  db_pub_form_attachments,
  db_pub_form_settings,
  db_pub_form_submissions,
  db_pub_form_validation,
  db_site_publish_info,
  db_sites,
  db_user_roles,
} from "common/models/database";
import { EditorData } from "common/models/projects/editorDataTypes";
import { EnvironmentTypes } from "common/models/projects/Environment";
import { FormSettingsModel } from "common/models/projects/forms/FormSettingsModel";
import { FormSubmissionModel } from "common/models/projects/forms/FormSubmissionModel";
import { ProjectModel } from "common/models/projects/ProjectModel";
import { PublishModel } from "common/models/projects/PublishModel";
import { UserModel } from "common/models/user/UserModel";
import { basename } from "node:path";
import { getKeyCloakUserRoles } from "server/api/auth/userFromReq";
import { copyDir } from "server/utils/copyDir";
import { createSimpleId } from "server/utils/createId";
import { knex } from "server/utils/database";
import { getAssetDir } from "server/utils/uploadDir";
import { createIndex, getCollection } from "../mongodb";

export async function up() {
  // TODO: copy the project directory to the new location

  // setup the indexes
  await createIndex(
    "projects",
    {
      projectId: 1,
    },
    {
      name: "projectId",
      unique: true,
    },
    false
  );

  await createIndex(
    "projects_published",
    {
      uuid: 1,
    },
    {
      name: "uuid",
      unique: true,
    },
    false
  );

  await createIndex(
    "project_members",
    {
      userId: 1,
      projectId: 1,
    },
    {
      name: "userId_projectId",
      unique: true,
    },
    false
  );

  await createIndex(
    "id_counters",
    {
      name: 1,
    },
    {
      name: "name",
      unique: true,
    }
  );

  await createIndex(
    "users",
    {
      id: 1,
    },
    {
      name: "id",
      unique: true,
    },
    false
  );
  await createIndex(
    "users",
    {
      email: 1,
    },
    {
      name: "email",
      unique: true,
    },
    false
  );

  await createIndex(
    "form_settings",
    {
      projectId: 1,
      projectEnv: 1,
      formName: 1,
    },
    {
      name: "projectId_projectEnv_formName",
      unique: true,
    },
    false
  );

  await createIndex(
    "form_submissions",
    {
      submissionId: 1,
    },
    {
      name: "submissionId",
      unique: true,
    },
    false
  );

  // copy the data from knex
  // this can be deleted once this version is deployed

  // ID COUNTERS
  await (async () => {
    const rows = await knex.table("id_counters").select("*");
    const collection = await getCollection("id_counters");

    for (const row of rows) {
      const { name, value } = row;

      // save the id to mongodb
      await collection.updateOne(
        {
          name,
        },
        {
          $max: { value },
        },
        {
          upsert: true,
        }
      );
    }
  })();

  // USERS
  await (async () => {
    const rows = await knex.table("users").select("*");
    const collection = await getCollection("users");

    for (const row of rows) {
      const { uuid, email, display_name, created_at, updated_at } = row;

      // get the roles for the user from keycloak
      const loaded: string[] = await getKeyCloakUserRoles(uuid);
      const roles = loaded.filter((role) => role.startsWith("struxt"));

      const user = new UserModel({
        id: uuid,
        email: email,
        name: display_name,
        created: {
          date: Math.floor(created_at.getTime() / 1000),
          userId: uuid,
          displayName: display_name,
        },
        updated: {
          date: Math.floor(updated_at.getTime() / 1000),
          userId: uuid,
          displayName: display_name,
        },
        roles,
      });

      // save the user to mongodb
      await collection.updateOne(
        {
          id: uuid,
        },
        {
          $set: user,
        },
        {
          upsert: true,
        }
      );
    }
  })();

  // PROJECTS
  await (async () => {
    const rows: db_sites[] = await knex
      .table("sites")
      .select("*")
      .orderBy("id");
    const collection = await getCollection("projects");

    for (const row of rows) {
      const stagingSettings: db_project_settings | null = await knex
        .table("project_settings")
        .where({
          site_id: row.id,
          site_env: "staging",
        })
        .first();
      const productionSettings: db_project_settings | null = await knex
        .table("project_settings")
        .where({
          site_id: row.id,
          site_env: "production",
        })
        .first();

      const domains: db_domains[] = await knex.table("domains").where({
        site_id: row.id,
      });

      // generate a new id
      const projectId = await createSimpleId("project");
      let editorData: EditorData = JSON.parse(row.project);

      if (editorData.assets) {
        const oldAssetDir = getAssetDir(row.id.toString());
        const projectAssetDir = getAssetDir(projectId);

        // copy the assets to the new directory
        await copyDir(oldAssetDir, projectAssetDir, {
          replace: true,
          preserveTimestamps: true,
        });

        for (const asset of editorData.assets) {
          if (asset.src) {
            const search = asset.src;
            const base = basename(search);
            const replace = `/assets/${projectId}/${base}`;

            editorData = recursiveReplaceText(editorData, search, replace);
          }
        }
      }

      const project = new ProjectModel({
        projectId,
        oldId: row.id.toString(),
        name: row.name,
        description: row.description,
        editorData,

        created: {
          date: Math.floor(row.created_at.getTime() / 1000),
          userId: "",
          displayName: "",
        },
        updated: {
          date: Math.floor(row.updated_at.getTime() / 1000),
          userId: row.updated_by || "",
          displayName: "",
        },

        staging: {
          forceSsl: stagingSettings ? Boolean(stagingSettings.force_ssl) : true,
          hsts: stagingSettings ? Boolean(stagingSettings.hsts) : true,
          domains: domains
            .filter((d) => d.site_env === "staging")
            .map((d) => {
              return {
                domain: d.domain,
                dnsVerified: {
                  active: true,
                  date: 0,
                },
                enabled: {
                  active: true,
                  date: 0,
                  userId: row.updated_by || "",
                  displayName: "",
                },
                isPrimary: Boolean(d.is_primary),
              };
            }),
        },

        production: {
          forceSsl: productionSettings
            ? Boolean(productionSettings.force_ssl)
            : true,
          hsts: productionSettings ? Boolean(productionSettings.hsts) : true,
          domains: domains
            .filter((d) => d.site_env === "production")
            .map((d) => {
              return {
                domain: d.domain,
                dnsVerified: {
                  active: true,
                  date: 0,
                },
                enabled: {
                  active: true,
                  date: 0,
                  userId: row.updated_by || "",
                  displayName: "",
                },
                isPrimary: Boolean(d.is_primary),
              };
            }),
        },
      });

      // save the project to mongodb
      await collection.updateOne(
        {
          oldId: project.oldId,
        },
        {
          $set: project,
        },
        {
          upsert: true,
        }
      );
    }
  })();

  async function getProjectId(oldId: number | string) {
    const collection = await getCollection<ProjectModel>("projects");

    const doc = await collection.findOne({
      oldId: oldId.toString(),
    });
    if (!doc) {
      throw new Error(`Project with id ${oldId} not found`);
    }
    return doc.projectId as string;
  }

  // PROJECT PERMISSIONS
  await (async () => {
    const rows: db_user_roles[] = await knex.table("user_roles").select("*");
    const collection = await getCollection("project_members");

    for (const row of rows) {
      if (!row.site_id) {
        continue;
      }

      const projectId = await getProjectId(row.site_id);

      await collection.updateOne(
        {
          userId: row.user_id,
          projectId,
        },
        {
          $set: {
            userId: row.user_id,
            projectId,
            updated: {
              date: Math.floor(row.updated_at.getTime() / 1000),
              userId: row.updated_by || "",
              displayName: "",
            },
          },
          $push: {
            roles: row.action,
          } as any,
        },
        {
          upsert: true,
        }
      );
    }
  })();

  // PUBLISHED DATA
  await (async () => {
    const rows: db_site_publish_info[] = await knex
      .table("site_publish_info")
      .select("*");
    const collection = await getCollection("projects_published");

    for (const row of rows) {
      const publishId = await createSimpleId("publish");

      const publish = new PublishModel({
        uuid: publishId,
        projectId: row.site_id.toString(),
        siteEnv: row.site_env as EnvironmentTypes,
        created: {
          date: Math.floor(row.published_at.getTime() / 1000),
          userId: row.published_by || "",
          displayName: "",
        },
      });

      // save the project to mongodb
      await collection.updateOne(
        {
          uuid: publish.uuid,
        },
        {
          $set: publish,
        },
        {
          upsert: true,
        }
      );
    }
  })();

  // FORM SETTINGS
  await (async () => {
    const rows: db_pub_form_settings[] = await knex
      .table("pub_form_settings")
      .select("*");
    const collection = await getCollection("form_settings");

    for (const row of rows) {
      if (!row.site_id) {
        continue;
      }

      const validationRows: db_pub_form_validation[] = await knex
        .table("pub_form_validation")
        .where({
          site_id: row.site_id,
          site_env: row.site_env,
          form_name: row.form_name,
          archived: "0",
        });

      const projectId = await getProjectId(row.site_id);

      const formSettings = new FormSettingsModel({
        projectId: projectId,
        projectEnv: row.site_env as EnvironmentTypes,
        formName: row.form_name,

        enabled: Boolean(row.enabled),

        email: {
          send: Boolean(row.send_email),
          to: row.email_to,
          subject: row.email_subject,
        },

        fields: validationRows.map((row) => {
          return {
            name: row.field_name,
            type: row.type as any,
            required: Boolean(row.required),
          };
        }),

        created: {
          date: Math.floor(row.created_at.getTime() / 1000),
          userId: "",
          displayName: "",
        },
        updated: {
          date: Math.floor(row.updated_at.getTime() / 1000),
          userId: "",
          displayName: "",
        },
      });

      // save the project to mongodb
      await collection.updateOne(
        {
          projectId: formSettings.projectId,
          projectEnv: formSettings.projectEnv,
          formName: formSettings.formName,
        },
        {
          $set: formSettings,
        },
        {
          upsert: true,
        }
      );
    }
  })();

  // FORM SUBMISSIONS
  await (async () => {
    const rows: db_pub_form_submissions[] = await knex
      .table("pub_form_submissions")
      .select("*");
    const collection = await getCollection("form_submissions");

    for (const row of rows) {
      if (!row.site_id) {
        continue;
      }

      const attachmentRows: db_pub_form_attachments[] = await knex
        .table("pub_form_attachments")
        .where({
          submission_id: row.id,
        });

      const projectId = await getProjectId(row.site_id);

      const formSubmission = new FormSubmissionModel({
        submissionId: row.id.toString(),
        projectId: projectId,
        projectEnv: row.site_env as EnvironmentTypes,
        formName: row.form_name,
        createdDate: Math.floor(row.created_at.getTime() / 1000),

        formData: JSON.parse(row.contents),

        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        sentEmailId: row.sent_email_id,

        attachments: attachmentRows.map((row) => {
          return {
            fileName: row.file_name,
            originalName: row.original_name,
            avStatus: row.av_status,
            avResult: row.av_result,
          };
        }),
      });

      // save the project to mongodb
      await collection.updateOne(
        {
          submissionId: formSubmission.submissionId,
        },
        {
          $set: formSubmission,
        },
        {
          upsert: true,
        }
      );
    }
  })();
}

export async function down() {}

function recursiveReplaceText<T extends object>(
  data: T,
  search: string,
  replace: string
): T {
  for (const key in data) {
    if (typeof data[key] === "string") {
      if (data[key] === search) {
        data[key] = replace as any;
      }
    }

    if (typeof data[key] === "object") {
      data[key] = recursiveReplaceText(data[key] as any, search, replace);
    }
  }

  return data;
}
