import { Component, Project } from "server/api/projects/projectTypes.ts";
import { FormValidation } from "./validateFormData.ts";

/**
 * Get the form validation data from the project
 *
 * @param projectId
 * @param project
 * @returns
 */

export function getFormValidationFromProject(
  projectId: string,
  siteEnv: "staging" | "production",
  project: Project
): FormValidation[] {
  const replaceFormId: { [key: string]: string } = {};
  const validation: FormValidation[] = [];

  const recurse = (
    components: Component[],
    currentFormId: string,
    depth: number
  ) => {
    const validation: FormValidation[] = [];

    for (const component of components) {
      const attributes = component.attributes;

      if (component.type === "form" && attributes) {
        currentFormId = attributes.id;
      }

      if (Array.isArray(component.components) && component.type !== "select") {
        validation.push(
          ...recurse(component.components, currentFormId, depth + 1)
        );
        continue;
      }

      if (!attributes) {
        continue;
      }
      if (!currentFormId) {
        continue;
      }

      if (
        (component.type === "input" ||
          component.type === "textarea" ||
          component.type === "select") &&
        attributes.name
      ) {
        if (attributes.name === "form_name") {
          replaceFormId[currentFormId] = attributes.value as string;
        }

        validation.push({
          projectId,
          siteEnv,
          formName: "",
          fieldName: attributes.name,
          type: (attributes.type as any) || "text",
          required: Boolean(attributes.required),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    validation.forEach((v) => {
      if (v.formName === "") {
        v.formName = currentFormId;
      }
    });

    return validation;
  };

  // find any forms in the project
  for (const page of project.pages) {
    for (const frame of page.frames) {
      const components = frame.component.components;
      if (!components) {
        continue;
      }

      validation.push(...recurse(components, "", 1));
    }
  }

  for (const v of validation) {
    if (replaceFormId[v.formName]) {
      v.formName = replaceFormId[v.formName];
    }
  }

  return validation;
}
