import { describe, expect, it } from "vitest";
import { calculateHeightResize, HeightResizeParams } from "./heightDragMath";

const BASE: Omit<
  HeightResizeParams,
  "heights" | "handleIdx" | "deltaY" | "collapsedStates"
> = {
  containerHeight: 800,
  minFirstHeight: 150,
  minSectionHeight: 60,
  dragHandleHeight: 4,
  sectionHeaderHeight: 28,
};

function allExpanded(count: number): boolean[] {
  return Array(count + 1).fill(false);
}

describe("calculateHeightResize — 2 fixed sections (N=2)", () => {
  it("handle 0: increases heights[0] when dragging up", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 0,
      deltaY: -50,
    });
    expect(result[0]).toBe(200);
    expect(result[1]).toBe(150);
  });

  it("handle 0: decreases heights[0] when dragging down", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 0,
      deltaY: 50,
    });
    expect(result[0]).toBe(100);
    expect(result[1]).toBe(150);
  });

  it("handle 0: caps heights[0] so combined total respects maxTotal", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 0,
      deltaY: -999,
    });
    const allHandleHeights = 2 * BASE.dragHandleHeight;
    const maxTotal =
      BASE.containerHeight - allHandleHeights - BASE.minFirstHeight;
    expect(result[0] + result[1]).toBeLessThanOrEqual(maxTotal);
  });

  it("handle 0: overflow cascades into heights[1] when heights[0] hits floor", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [65, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 0,
      deltaY: 10,
    });
    expect(result[0]).toBe(60);
    expect(result[1]).toBeLessThan(150);
  });

  it("handle 0: redirects to heights[1] when heights[0] section is collapsed", () => {
    const collapsed = [false, true, false];
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 200],
      collapsedStates: collapsed,
      handleIdx: 0,
      deltaY: -30,
    });
    expect(result[0]).toBe(150);
    expect(result[1]).toBe(230);
  });

  it("handle 0: returns unchanged when all fixed sections are collapsed", () => {
    const collapsed = [false, true, true];
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: collapsed,
      handleIdx: 0,
      deltaY: -50,
    });
    expect(result).toEqual([150, 150]);
  });

  it("handle 1: redistributes at fixed sum when dragging down", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 1,
      deltaY: 40,
    });
    expect(result[0]).toBe(190);
    expect(result[1]).toBe(110);
  });

  it("handle 1: redistributes at fixed sum when dragging up", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 1,
      deltaY: -40,
    });
    expect(result[0]).toBe(110);
    expect(result[1]).toBe(190);
  });

  it("handle 1: clamps hAbove at minSectionHeight and lets hBelow steal from flex", () => {
    // -200 exceeds what heights[0] can give (90px), so 110px should come from flex
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 1,
      deltaY: -200,
    });
    expect(result[0]).toBe(60); // at minimum
    expect(result[1]).toBeGreaterThan(150); // grew beyond fixed pair (stole from flex)
    expect(result[1]).toBeGreaterThanOrEqual(BASE.minSectionHeight);
  });

  it("handle 1: clamps hBelow at minSectionHeight", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 1,
      deltaY: 200,
    });
    expect(result[1]).toBeGreaterThanOrEqual(BASE.minSectionHeight);
    expect(result[0]).toBeGreaterThanOrEqual(BASE.minSectionHeight);
  });

  it("handle 1: both sections respect minSectionHeight at extreme deltas", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 1,
      deltaY: 9999,
    });
    expect(result[0]).toBeGreaterThanOrEqual(BASE.minSectionHeight);
    expect(result[1]).toBeGreaterThanOrEqual(BASE.minSectionHeight);
  });
});

describe("calculateHeightResize — 3 fixed sections (N=3)", () => {
  it("handle 0: resizes only heights[0], leaves others unchanged", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 0,
      deltaY: -40,
    });
    expect(result[0]).toBe(190);
    expect(result[1]).toBe(150);
    expect(result[2]).toBe(150);
  });

  it("handle 0: caps heights[0] accounting for all other sections", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 0,
      deltaY: -9999,
    });
    const allHandleHeights = 3 * BASE.dragHandleHeight;
    const maxTotal =
      BASE.containerHeight - allHandleHeights - BASE.minFirstHeight;
    const total = result[0] + result[1] + result[2];
    expect(total).toBeLessThanOrEqual(maxTotal);
  });

  it("handle 1: redistributes heights[0] and heights[1], leaves heights[2] unchanged", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 1,
      deltaY: 30,
    });
    expect(result[0]).toBe(180);
    expect(result[1]).toBe(120);
    expect(result[2]).toBe(150);
  });

  it("handle 2: redistributes heights[1] and heights[2], leaves heights[0] unchanged", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 2,
      deltaY: 30,
    });
    expect(result[0]).toBe(150);
    expect(result[1]).toBe(180);
    expect(result[2]).toBe(120);
  });

  it("handle 1: respects maxForEither accounting for heights[2]", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 1,
      deltaY: 9999,
    });
    const allHandleHeights = 3 * BASE.dragHandleHeight;
    const maxTotal =
      BASE.containerHeight - allHandleHeights - BASE.minFirstHeight;
    const maxForEither = maxTotal - 150 - BASE.minSectionHeight;
    expect(result[0]).toBeLessThanOrEqual(maxForEither);
    expect(result[1]).toBeGreaterThanOrEqual(BASE.minSectionHeight);
  });

  it("handle 0: skip collapsed section 1 and resize section 2 (redirect)", () => {
    const collapsed = [false, true, false, false];
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 200, 120],
      collapsedStates: collapsed,
      handleIdx: 0,
      deltaY: -50,
    });
    expect(result[0]).toBe(150);
    expect(result[1]).toBe(250);
    expect(result[2]).toBe(120);
  });

  it("handle 0 DOWN redirect: cascades when redirected target floors (reported bug)", () => {
    // Routine Envs collapsed → target is Environments (idx 1).
    // Environments has only 5px before its floor; Settings absorbs the rest.
    const collapsed = [false, true, false, false];
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 65, 150],
      collapsedStates: collapsed,
      handleIdx: 0,
      deltaY: 50,
    });
    expect(result[0]).toBe(150); // Routine Envs stored height unchanged (collapsed)
    expect(result[1]).toBe(60); // Environments floored (had 5px available)
    expect(result[2]).toBe(105); // Settings absorbed remaining 45px
  });

  it("handle 0 DOWN redirect: skips collapsed sections when cascading further", () => {
    // 4 fixed sections. Idx 1 & 2 are collapsed → redirect target is idx 2 (heights[2]=65).
    // heights[2] has 5px before floor; the remaining 45px cascade into heights[3].
    // Collapsed sections (heights[0] and heights[1]) are never touched.
    const collapsed = [false, true, true, false, false]; // 5 entries for 1 flex + 4 fixed
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 200, 65, 150],
      collapsedStates: collapsed,
      handleIdx: 0,
      deltaY: 50,
    });
    expect(result[0]).toBe(150); // Routine Envs frozen (collapsed)
    expect(result[1]).toBe(200); // Environments frozen (collapsed)
    expect(result[2]).toBe(60); // 3rd fixed section floored
    expect(result[3]).toBe(105); // 4th fixed section absorbed the remaining 45px
  });
});

describe("calculateHeightResize — flex protection", () => {
  it("never lets combined fixed heights starve the flex section", () => {
    const params: HeightResizeParams = {
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 0,
      deltaY: -9999,
    };
    const result = calculateHeightResize(params);
    const allHandleHeights = 2 * BASE.dragHandleHeight;
    const usedByFixed = result[0] + result[1];
    const remainingForFlex =
      BASE.containerHeight - allHandleHeights - usedByFixed;
    expect(remainingForFlex).toBeGreaterThanOrEqual(BASE.minFirstHeight);
  });
});

describe("calculateHeightResize — cascade (DOWN drag through floored sections)", () => {
  it("N=2: handle 1 DOWN stays within heights[1] budget when it does not floor", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 1,
      deltaY: 40,
    });
    expect(result[0]).toBe(190);
    expect(result[1]).toBe(110);
  });

  it("N=2: handle 1 DOWN exhausts heights[1] to min then stops (no flex theft)", () => {
    // heights = [150,150], totalAvailable from [1..] = 90
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 1,
      deltaY: 9999,
    });
    expect(result[0]).toBe(240); // grew by exactly 90
    expect(result[1]).toBe(60); // at minimum
  });

  it("N=3: handle 1 DOWN cascades into heights[2] once heights[1] floors", () => {
    // heights[1] has 5px of room before floor, the rest comes from heights[2]
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 65, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 1,
      deltaY: 50,
    });
    expect(result[0]).toBe(200); // grew by 50
    expect(result[1]).toBe(60); // at minimum (5px taken)
    expect(result[2]).toBe(105); // absorbs remaining 45px
  });

  it("N=3: handle 1 DOWN exhausts both heights[1] and heights[2] without stealing from flex", () => {
    // totalAvailable = (150-60) + (150-60) = 180
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 1,
      deltaY: 9999,
    });
    expect(result[0]).toBe(330); // grew by 180
    expect(result[1]).toBe(60);
    expect(result[2]).toBe(60);
    // Total unchanged — no flex theft
    expect(result[0] + result[1] + result[2]).toBe(450);
  });

  it("N=3: handle 0 DOWN cascade: overflow from heights[0] pushes into heights[1] then heights[2]", () => {
    // heights[0]=62 (2px above min), heights[1]=62 (2px above min), heights[2]=150
    // deltaY=10 → h0 tries to become 52, overflow = 8
    // i=1: available=2, taken=2 → heights[1]=60, overflow=6
    // i=2: available=90, taken=6 → heights[2]=144
    const result = calculateHeightResize({
      ...BASE,
      heights: [62, 62, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 0,
      deltaY: 10,
    });
    expect(result[0]).toBe(60);
    expect(result[1]).toBe(60);
    expect(result[2]).toBe(144);
  });

  it("N=3: handle 2 DOWN is already the last handle and behaves as before", () => {
    // Last handle — no sections beyond heights[2] to cascade into
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 2,
      deltaY: 9999,
    });
    expect(result[1]).toBe(240); // grew by 90 (all heights[2] had available)
    expect(result[2]).toBe(60);
    expect(result[0]).toBe(150);
  });
});

describe("calculateHeightResize — cascade (UP drag through floored sections)", () => {
  it("N=2: handle 1 UP normal (no floor hit)", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 1,
      deltaY: -40,
    });
    expect(result[0]).toBe(110);
    expect(result[1]).toBe(190);
  });

  it("N=2: handle 1 UP exhausts heights[0] then steals from flex", () => {
    // heights[0] can give 90px; rest comes from flex
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150],
      collapsedStates: allExpanded(2),
      handleIdx: 1,
      deltaY: -200,
    });
    expect(result[0]).toBe(60); // at minimum
    expect(result[1]).toBeGreaterThan(240); // 90 from heights[0] + 110 from flex
  });

  it("N=3: handle 2 UP cascades into heights[0] once heights[1] floors", () => {
    // heights[1] has 5px before floor; rest of 50px comes from heights[0]
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 65, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 2,
      deltaY: -50,
    });
    expect(result[2]).toBe(200); // grew by 50
    expect(result[1]).toBe(60); // at minimum (5px taken)
    expect(result[0]).toBe(105); // absorbed remaining 45px
  });

  it("N=3: handle 2 UP cascades through both sections before stealing from flex", () => {
    // drag 200px up; heights[1] gives 90, heights[0] gives 90 = 180 total from fixed
    // remaining 20px comes from flex
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 2,
      deltaY: -200,
    });
    expect(result[2]).toBe(350);
    expect(result[1]).toBe(60);
    expect(result[0]).toBe(60);
  });

  it("N=3: handle 2 UP respects flex minimum — cannot grow past maxGrowth", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 2,
      deltaY: -9999,
    });
    const allHandleHeights = 3 * BASE.dragHandleHeight;
    const usedByFixed = result[0] + result[1] + result[2];
    const remainingForFlex =
      BASE.containerHeight - allHandleHeights - usedByFixed;
    expect(remainingForFlex).toBeGreaterThanOrEqual(BASE.minFirstHeight);
    expect(result[1]).toBe(60);
    expect(result[0]).toBe(60);
  });

  it("N=3: handle 1 UP only cascades into heights[0], not beyond", () => {
    const result = calculateHeightResize({
      ...BASE,
      heights: [150, 150, 150],
      collapsedStates: allExpanded(3),
      handleIdx: 1,
      deltaY: -200,
    });
    expect(result[0]).toBe(60); // at minimum
    expect(result[1]).toBeGreaterThan(240); // grew from heights[0] + flex
    expect(result[2]).toBe(150); // unchanged
  });
});
