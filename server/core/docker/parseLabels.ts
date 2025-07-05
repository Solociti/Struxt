/**
 * Parse the labels of a Docker service.
 *
 * @param labelString
 * @returns
 */
export function parseLabels(labelString: string): Record<string, string> {
  const labels: Record<string, string> = {};

  const list = labelString.split(",");
  let lastKey = "";

  while (list.length > 0) {
    const item = list.shift();
    if (!item) {
      continue;
    }

    if (item.includes("=")) {
      const [key, value] = item.split("=");
      labels[key.trim()] = value.trim();
      lastKey = key.trim();
    } else {
      if (lastKey) {
        labels[lastKey] += `,${item.trim()}`;
      }
    }
  }

  return labels;
}
