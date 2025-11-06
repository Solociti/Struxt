import { z } from "zod";

export interface PageContext {
  id: string;
  name: string;
  slug: string;
}

export interface ComponentContext {
  id: string;
  type: string;
  parentId?: string;
  html: string;
}

/**
 * Context sent with the user message to provide additional information.
 */
export interface AiMessageContext {
  /**
   * The currently selected components in the editor.
   */
  selected: ComponentContext[];

  /**
   * Current page being edited.
   */
  page: PageContext;

  /**
   * The current device being edited in the editor.
   */
  currentDevice: "desktop" | "tablet" | "mobileLandscape" | "mobilePortrait";
}

/**
 * Get the zod structure for the context
 *
 * @returns
 */
export function zAiMessageContext() {
  return z.object({
    selected: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        parentId: z.string().optional(),
        html: z.string(),
      })
    ),
    page: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    }),
    currentDevice: z.enum([
      "desktop",
      "tablet",
      "mobileLandscape",
      "mobilePortrait",
    ]),
  });
}
