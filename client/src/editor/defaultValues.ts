import {
  CategoryBaseProps,
  GlobalStyleProps,
  GlobalStylesConfig,
} from "@grapesjs/studio-sdk";

const body: CategoryBaseProps = { id: "body", label: "Body" };
const headings: CategoryBaseProps = { id: "headings", label: "Headings" };
const links: CategoryBaseProps = { id: "links", label: "Links" };

const sizeField = (step = 0.1): GlobalStyleProps["field"] => ({
  type: "number",
  step,
  units: ["rem", "em", "px"],
});

export const globalStyles: GlobalStylesConfig = {
  default: [
    // Body
    {
      id: "body-font",
      property: "font-family",
      field: "selectFont",
      selector: "body",
      label: "Font",
      category: body,
    },
    {
      id: "body-font-size",
      property: "font-size",
      field: sizeField(0.05),
      selector: "body",
      label: "Text size",
      category: body,
    },
    {
      id: "body-line-height",
      property: "line-height",
      field: sizeField(0.05),
      selector: "body",
      label: "Line height",
      category: body,
    },
    {
      id: "body-color",
      property: "color",
      field: "color",
      selector: "body",
      label: "Text color",
      category: body,
    },
    {
      id: "body-background",
      property: "background-color",
      field: "color",
      selector: "body",
      label: "Background",
      category: body,
    },

    // Headings
    {
      id: "heading-font",
      property: "font-family",
      field: "selectFont",
      selector: "h1, h2, h3, h4, h5, h6",
      label: "Font",
      category: headings,
    },
    {
      id: "heading-color",
      property: "color",
      field: "color",
      selector: "h1, h2, h3, h4, h5, h6",
      label: "Color",
      category: headings,
    },
    ...["h1", "h2", "h3", "h4", "h5"].map((tag) => ({
      id: `${tag}-size`,
      property: "font-size",
      field: sizeField(),
      selector: tag,
      label: `${tag.toUpperCase()} size`,
      category: headings,
    })),

    // Links
    {
      id: "link-color",
      property: "color",
      field: "color",
      selector: "a",
      label: "Color",
      category: links,
    },
    {
      id: "link-underline",
      property: "text-decoration",
      field: {
        type: "radio",
        options: [
          { id: "underline", label: "Underline" },
          { id: "none", label: "None" },
        ],
      },
      selector: "a",
      label: "Underline",
      category: links,
    },
  ],
};
