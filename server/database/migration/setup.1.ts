import { ProjectModel } from "common/models/projects/ProjectModel";
import { createSimpleId } from "server/utils/createId";
import { createIndex, getCollection } from "../mongodb";

export async function up() {
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

  // create the base project
  const projectId = await createSimpleId("project");
  const baseProject = new ProjectModel({
    projectId,
    name: "Struxt",
    description: "Default struxt editor site.",
    isEditorSite: true,
  });

  const projectCollection = await getCollection<ProjectModel>("projects");
  await projectCollection.insertOne(baseProject);
}

export async function down() {}
