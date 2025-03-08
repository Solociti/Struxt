export interface Props {
  children?: (
    | string
    | {
        type: string;
        props: Props;
      }
  )[];

  className?: string | string[];

  [key: string]: any;
}

export function createChild(
  parent: HTMLElement | null,
  type: string,
  props: Props
) {
  // setup the new element
  const child = document.createElement(type);
  updateElementProps(child, props);

  // setup the parent-child relationship
  if (parent) {
    parent.appendChild(child);
  }

  return {
    child,
    updateProps(newProps: Props) {
      updateElementProps(child, newProps);
    },
  };
}

/**
 * Update the attributes of an element
 *
 * @param element
 * @param props
 */
export function updateElementProps(element: HTMLElement, props: Props) {
  for (const key in props) {
    const value = props[key];

    // handle special cases
    if (key === "children") {
      if (!Array.isArray(props.children)) {
        throw new Error("children must be an array");
      }

      for (const child of props.children) {
        if (typeof child === "string") {
          element.innerText += child;
          continue;
        }

        createChild(element, child.type, child.props);
      }
      continue;
    }

    if (key === "className") {
      const classNames = (
        Array.isArray(value) ? value : value.split(" ")
      ).filter(Boolean);

      if (classNames.length > 0) {
        element.classList.add(...classNames);
      }
      continue;
    }

    if (value === null) {
      element.removeAttribute(key);
      continue;
    }

    element.setAttribute(key, value);
  }
}
