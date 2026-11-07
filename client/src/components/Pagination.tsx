import B_Pagination from "react-bootstrap/Pagination";

export interface PaginationProps {
  current: number;
  total: number;

  onPageChange: (page: number) => void;

  maxButtons?: number;
}

const maxPageButtons = 7;

type PageItem = number | "...";

/**
 * Get page numbers for pagination
 *
 * @param current
 * @param total
 * @param maxBtn
 * @returns
 */
function getPages(current: number, total: number, maxBtn: number): PageItem[] {
  // Need at least 5 slots: first, last, 2 ellipses, 1 center button
  const max = Math.max(5, maxBtn);
  if (total <= max) {
    return range(1, total);
  }

  current = Math.min(Math.max(current, 1), total);

  const center = max - 4; // buttons between the two ellipses
  const half = Math.floor(center / 2);
  const start = current - half;
  const end = start + center - 1;

  // Window touches the left side: no left ellipsis (page 2 is shown if hidden gap would be 1)
  if (start <= 3) {
    return [...range(1, max - 2), "...", total];
  }

  // Window touches the right side: no right ellipsis
  if (end >= total - 2) {
    return [1, "...", ...range(total - (max - 3), total)];
  }

  // Floating window with both ellipses
  return [1, "...", ...range(start, end), "...", total];
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/**
 * Setup pagination component
 *
 * @param param0
 * @returns
 */
export function Pagination({
  current,
  total,
  maxButtons,
  onPageChange,
}: PaginationProps) {
  const maxBtn = maxButtons ?? maxPageButtons;

  const pages = getPages(current, total, maxBtn);

  return (
    <B_Pagination>
      <B_Pagination.Prev onClick={() => onPageChange(current - 1)} />

      {pages.map((p, i) => {
        if (p === "...") {
          const prev = pages[i - 1];
          const next = pages[i + 1];

          return (
            <B_Pagination.Ellipsis
              key={i}
              onClick={() => {
                if (typeof prev === "number" && typeof next === "number") {
                  onPageChange(Math.floor((prev + next) / 2));
                }
              }}
            />
          );
        }

        return (
          <B_Pagination.Item
            key={i}
            active={p === current}
            onClick={() => onPageChange(p as number)}
          >
            {p}
          </B_Pagination.Item>
        );
      })}

      <B_Pagination.Next onClick={() => onPageChange(current + 1)} />
    </B_Pagination>
  );
}
