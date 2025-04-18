import { expect, test, describe } from "vitest";
import { getFormFieldsFromEditorData } from "./getFormFieldsFromEditorData";
import { EditorData } from "common/models/projects/editorDataTypes";

describe("get form fields from editor data", () => {
  const editorData: EditorData = {
    assets: [],
    styles: [],
    pages: [
      {
        name: "Web",
        frames: [
          {
            component: {
              type: "wrapper",
              attributes: {
                id: "i5h4",
              },
              components: [
                {
                  type: "form",
                  attributes: {
                    method: "get",
                    id: "igmc",
                  },
                  components: [
                    {
                      type: "input",
                      void: true,
                      attributes: {
                        type: "text",
                        id: "imdjj",
                        name: "form_name",
                        value: "simple-form",
                        required: true,
                      },
                    },
                    {
                      attributes: {
                        id: "iufv",
                      },
                      components: [
                        {
                          type: "label",
                          components: [
                            {
                              type: "textnode",
                              content: "Name",
                            },
                          ],
                        },
                        {
                          type: "input",
                          void: true,
                          attributes: {
                            type: "text",
                            id: "izecn",
                            required: true,
                            name: "name",
                          },
                        },
                      ],
                    },
                    {
                      components: [
                        {
                          type: "label",
                          components: [
                            {
                              type: "textnode",
                              content: "Email",
                            },
                          ],
                        },
                        {
                          type: "input",
                          void: true,
                          attributes: {
                            type: "email",
                            id: "i198h",
                            required: true,
                            name: "email",
                          },
                        },
                      ],
                    },
                    {
                      type: "select",
                      attributes: {
                        type: "text",
                        id: "i2434",
                        name: "select-0",
                      },
                      components: [
                        {
                          type: "option",
                          content: "Option 1",
                          attributes: {
                            value: "opt1",
                          },
                        },
                        {
                          type: "option",
                          content: "Option 2",
                          attributes: {
                            value: "opt2",
                          },
                        },
                      ],
                    },
                    {
                      components: [
                        {
                          type: "label",
                          components: [
                            {
                              type: "textnode",
                              content: "Gender",
                            },
                          ],
                        },
                        {
                          type: "checkbox",
                          void: true,
                          attributes: {
                            type: "checkbox",
                            value: "M",
                            name: "checkbox-0",
                          },
                        },
                        {
                          type: "label",
                          components: [
                            {
                              type: "textnode",
                              content: "M",
                            },
                          ],
                        },
                        {
                          type: "checkbox",
                          void: true,
                          attributes: {
                            type: "checkbox",
                            value: "F",
                            name: "checkbox-1",
                          },
                        },
                        {
                          type: "label",
                          components: [
                            {
                              type: "textnode",
                              content: "F",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      components: [
                        {
                          type: "label",
                          components: [
                            {
                              type: "textnode",
                              content: "Message",
                            },
                          ],
                        },
                        {
                          type: "textarea",
                          attributes: {
                            name: "textarea-0",
                          },
                        },
                      ],
                    },
                    {
                      attributes: {
                        id: "izba7",
                      },
                      components: [
                        {
                          type: "button",
                          attributes: {
                            type: "button",
                          },
                          components: [
                            {
                              type: "contentEditable",
                              components: [
                                {
                                  type: "textnode",
                                  content: "Button",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
              head: {
                type: "head",
              },
              docEl: {
                tagName: "html",
              },
            },
            id: "ozBcDMOJDHJAiSt0",
          },
        ],
        id: "HRmhlLmUtLNMDOWj",
      },
    ],
    symbols: [],
    dataSources: [],
    custom: {
      projectType: "web",
      id: "",
    },
  };

  test("should extract the form fields", () => {
    const formFields = getFormFieldsFromEditorData(editorData);

    expect(formFields).toStrictEqual([
      {
        formId: "igmc",
        formName: "simple-form",
        fieldName: "form_name",
        fieldType: "text",
        fieldRequired: true,
      },
      {
        formId: "igmc",
        formName: "simple-form",
        fieldName: "name",
        fieldType: "text",
        fieldRequired: true,
      },
      {
        formId: "igmc",
        formName: "simple-form",
        fieldName: "email",
        fieldType: "email",
        fieldRequired: true,
      },
      {
        formId: "igmc",
        formName: "simple-form",
        fieldName: "select-0",
        fieldType: "text",
        fieldRequired: false,
      },
      {
        formId: "igmc",
        formName: "simple-form",
        fieldName: "checkbox-0",
        fieldType: "checkbox",
        fieldRequired: false,
      },
      {
        formId: "igmc",
        formName: "simple-form",
        fieldName: "checkbox-1",
        fieldType: "checkbox",
        fieldRequired: false,
      },
      {
        formId: "igmc",
        formName: "simple-form",
        fieldName: "textarea-0",
        fieldType: "text",
        fieldRequired: false,
      },
    ]);
  });
});
