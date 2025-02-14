import { Editor } from "grapesjs";

/**
 * Add the list of custom fonts to the editor
 *
 * @param editor
 */
export function addFonts(editor: Editor) {
  editor.Canvas.canvas.attributes.styles.push(
    "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
  );

  editor.onReady(() => {
    const sectors = editor.StyleManager.getSectors();
    const typography = sectors.models.find(
      (model) => model.getName() === "Typography"
    );
    if (!typography) {
      return;
    }

    const property = typography.getProperty("font-family");
    if (!property) {
      return;
    }

    // @ts-ignore
    const currentOptions = property.getOptions() as {
      id: string;
      label: string;
    }[];

    // add the fonts
    currentOptions.push({
      id: "Roboto, sans-serif",
      label: "Roboto",
    });

    currentOptions.sort((a, b) => a.label.localeCompare(b.label));

    // @ts-ignore
    property.setOptions(currentOptions);
  });
}
