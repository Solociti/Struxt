/**
 * Returns true if the element is a GrapesJS component.
 *
 * @param el
 * @returns
 */
export function isGrapesJsComponent(el: HTMLElement) {
  const classString = (el.getAttribute && el.getAttribute("class")) || "";
  return classString.includes("gjs-");
}
