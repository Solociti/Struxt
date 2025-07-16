import { Editor, TraitProperties } from "grapesjs";

/**
 * Get the default traits for most components
 *
 * @param editor
 * @returns
 */
export function getDefaultTraits(editor: Editor) {
  const defaults = editor.DomComponents.getType("default").model.getDefaults();
  return defaults.traits as TraitProperties[];
}

/**
 * Get the trait for custom attributes
 *
 * @param editor
 * @returns
 */
export function customAttributesTrait(editor: Editor) {
  const traits = getDefaultTraits(editor);

  const trait = traits.find((trait) => trait.name === "customAttributes");
  return trait;
}

/**
 * setup the custom trait types
 *
 * @param editor
 */
export function setupTraitTypes(editor: Editor) {
  editor.TraitManager.addType("asset-src", {});
  editor.TraitManager.addType("href", {});
}
