export const sidebarConstants = {
  headerHeight: 28,
  dragHandleHeight: 4,
  minSectionHeight: 60,
};

export interface HeightResizeParams {
  heights: number[];
  collapsedStates: boolean[];
  handleIdx: number;
  deltaY: number;
  containerHeight: number;
  minFirstHeight: number;
  minSectionHeight: number;
  dragHandleHeight: number;
  sectionHeaderHeight: number;
}

/**
 * Pure function that computes new fixed section heights after a drag event.
 * Works for any number of fixed sections. Preserves all constraints:
 * - No section below `minSectionHeight`
 * - Combined fixed heights respect `minFirstHeight` for the flex section
 * - Handle 0 redirects past collapsed sections
 * - Overflow cascades into the adjacent section when a floor is hit
 *
 * @param params
 */
export function calculateHeightResize(params: HeightResizeParams): number[] {
  const {
    heights,
    collapsedStates,
    handleIdx,
    deltaY,
    containerHeight,
    minFirstHeight,
    minSectionHeight,
    dragHandleHeight,
    sectionHeaderHeight,
  } = params;

  const fixedCount = heights.length;
  const allHandleHeights = fixedCount * dragHandleHeight;
  const maxTotal = containerHeight - allHandleHeights - minFirstHeight;

  const newHeights = [...heights];

  if (handleIdx === 0) {
    const firstExpanded = collapsedStates.slice(1).findIndex((c) => !c);
    const targetIdx = firstExpanded === -1 ? fixedCount : firstExpanded;

    if (targetIdx >= fixedCount) {
      return newHeights;
    }

    if (targetIdx === 0) {
      let h0 = heights[0] - deltaY;
      const otherSum = sumRange(heights, 1, fixedCount);
      h0 = Math.min(h0, maxTotal - otherSum);

      if (h0 < minSectionHeight) {
        let overflow = minSectionHeight - h0;
        h0 = minSectionHeight;
        // Cascade overflow into subsequent fixed sections in order
        for (let i = 1; i < fixedCount && overflow > 0; i++) {
          const available = heights[i] - minSectionHeight;
          const taken = Math.min(available, overflow);
          newHeights[i] = heights[i] - taken;
          overflow -= taken;
        }
      }

      newHeights[0] = h0;
    } else {
      let effectiveOtherSum = 0;
      for (let i = 0; i < fixedCount; i++) {
        if (i === targetIdx) {
          continue;
        }
        effectiveOtherSum += collapsedStates[i + 1]
          ? sectionHeaderHeight
          : heights[i];
      }

      const maxForTarget = maxTotal - effectiveOtherSum;

      if (deltaY > 0) {
        // Dragging down: shrink from targetIdx onward, cascading into later
        // expanded sections. Skip collapsed ones — their stored height is frozen.
        let totalAvailable = 0;
        for (let i = targetIdx; i < fixedCount; i++) {
          if (collapsedStates[i + 1]) continue;
          totalAvailable += heights[i] - minSectionHeight;
        }
        let remaining = Math.min(deltaY, totalAvailable);
        for (let i = targetIdx; i < fixedCount && remaining > 0; i++) {
          if (collapsedStates[i + 1]) continue;
          const available = heights[i] - minSectionHeight;
          const taken = Math.min(available, remaining);
          newHeights[i] = heights[i] - taken;
          remaining -= taken;
        }
      } else {
        // Dragging up: only the target section grows; cap prevents flex starvation.
        newHeights[targetIdx] = Math.max(
          minSectionHeight,
          Math.min(maxForTarget, heights[targetIdx] - deltaY),
        );
      }
    }
  } else {
    const aboveIdx = handleIdx - 1;
    const belowIdx = handleIdx;
    const hAboveStart = heights[aboveIdx];
    const hBelowStart = heights[belowIdx];

    if (deltaY > 0) {
      // Dragging down: hAbove grows; cascade the reduction through belowIdx..last
      // so the drag isn't blocked by the floor of a single intermediate section.
      let totalAvailable = 0;
      for (let i = belowIdx; i < fixedCount; i++) {
        totalAvailable += heights[i] - minSectionHeight;
      }
      const growth = Math.min(deltaY, totalAvailable);
      newHeights[aboveIdx] = hAboveStart + growth;

      let remaining = growth;
      for (let i = belowIdx; i < fixedCount; i++) {
        const available = heights[i] - minSectionHeight;
        const taken = Math.min(available, remaining);
        newHeights[i] = heights[i] - taken;
        remaining -= taken;
        if (remaining <= 0) break;
      }
    } else {
      // Dragging up: hBelow grows; cascade the reduction upward through
      // heights[aboveIdx..0] in order, then steal from flex if all are exhausted.
      //
      // The growth cap must account for every section 0..aboveIdx being at its
      // minimum (not just the immediate neighbor), otherwise flex gets starved.
      const afterSum = sumRange(heights, belowIdx + 1, fixedCount);
      const maxGrowth =
        maxTotal - hBelowStart - minSectionHeight * (aboveIdx + 1) - afterSum;
      const desiredGrowth = Math.min(-deltaY, Math.max(0, maxGrowth));

      newHeights[belowIdx] = hBelowStart + desiredGrowth;

      let remaining = desiredGrowth;
      for (let i = aboveIdx; i >= 0 && remaining > 0; i--) {
        const available = heights[i] - minSectionHeight;
        const taken = Math.min(available, remaining);
        newHeights[i] = heights[i] - taken;
        remaining -= taken;
      }
    }
  }

  return newHeights;
}

/**
 * Sums heights[from..to) (exclusive upper bound).
 *
 * @param heights
 * @param from inclusive start index
 * @param to exclusive end index
 */
function sumRange(heights: number[], from: number, to: number): number {
  let sum = 0;
  for (let i = from; i < to; i++) {
    sum += heights[i] ?? 0;
  }
  return sum;
}
