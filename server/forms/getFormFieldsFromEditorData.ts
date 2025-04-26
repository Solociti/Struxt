import { Component, EditorData } from "common/models/projects/editorDataTypes";
import { FormSettingsField } from "common/models/projects/forms/FormSettingsModel";

interface FormFields {
  formId: string;
  formName: string;

  fieldName: string;
  fieldType: FormSettingsField["type"];
  fieldRequired: boolean;
}

/**
 * Get the form validation data from the project
 *
 * @param projectId
 * @param editorData
 * @returns
 */
export function getFormFieldsFromEditorData(
  editorData: EditorData
): FormFields[] {
  const formNames: { [key: string]: string } = {};
  const allFields: FormFields[] = [];

  // find any forms in the project
  for (const page of editorData.pages) {
    for (const frame of page.frames) {
      const components = frame.component.components;
      if (!components) {
        continue;
      }

      allFields.push(
        ...collectFieldsFromComponents(components, formNames, "", 1)
      );
    }
  }

  // set the form names
  for (const v of allFields) {
    if (formNames[v.formId]) {
      v.formName = formNames[v.formId];
    }
  }

  return allFields;
}

function collectFieldsFromComponents(
  components: Component[],
  formNames: { [key: string]: string },
  currentFormId: string,
  depth: number
) {
  const fields: FormFields[] = [];

  for (const component of components) {
    const attributes = component.attributes;

    if (component.type === "form" && attributes && attributes.id) {
      currentFormId = attributes.id;
    }

    if (Array.isArray(component.components) && component.type !== "select") {
      fields.push(
        ...collectFieldsFromComponents(
          component.components,
          formNames,
          currentFormId,
          depth + 1
        )
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
        component.type === "select" ||
        component.type === "checkbox") &&
      attributes.name
    ) {
      if (attributes.name === "form_name") {
        formNames[currentFormId] = attributes.value as string;
      }

      fields.push({
        formId: currentFormId,
        formName: "",
        fieldName: attributes.name,
        fieldType: (attributes.type as any) || "text",
        fieldRequired: Boolean(attributes.required),
      });
    }
  }

  return fields;
}
