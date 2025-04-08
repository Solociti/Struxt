import { useId } from "react";

export function useHtmlId() {
  const htmlId = useId();

  return {
    id(suffix: string) {
      return `${htmlId}-${suffix}`;
    },
    htmlId,
  };
}
