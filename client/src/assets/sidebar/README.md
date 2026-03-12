# Asset Sidebar

## Adding a New Section

The sidebar is data-driven. **All you need to do is append one entry to `sidebarSections` in [`sectionRegistry.ts`](./sectionRegistry.ts).**

```ts
{
  id: "my-section",          // unique string key
  title: "My Section",       // header label
  isFlex: false,             // always false for new sections (only Assets is flex)
  canCollapse: true,         // whether the header shows a collapse toggle
  defaultHeight: 150,        // initial height in px
  defaultCollapsed: false,   // initial collapsed state
  contentComponent: MyComponent,
}
```

- Import your component at the top of `sectionRegistry.ts`.
- Order matters — sections render from top to bottom; section 0 must always be the flex (Assets) section.
- No other files need changing. Heights, collapsed state, drag handles, and localStorage persistence all adapt automatically.
- If localStorage already holds a saved state with a different number of sections, it resets to defaults on the next load.

---

## Structure

The sidebar renders sections in a vertical column:

| Index | Title                | Collapsible | Height control                    |
| ----- | -------------------- | ----------- | --------------------------------- |
| 0     | Assets               | No          | `flex: 1` (fills remaining space) |
| 1     | Routine Environments | Yes         | Fixed px (`heights[0]`)           |
| 2     | Environments         | Yes         | Fixed px (`heights[1]`)           |
| 3     | Settings             | Yes         | Fixed px (`heights[2]`)           |

Between each adjacent pair of sections sits a **4px drag handle** (`SectionDragHandle`) for vertical resizing. A 5px invisible strip on the right edge controls horizontal width resizing.

---

## Persistent State

Stored in `localStorage` under the key `"asset-sidebar"` via `useSidebarState`.

```ts
interface SidebarStoredState {
  width: number; // sidebar width in px
  heights: number[]; // pixel heights of fixed sections (sections 1..N)
  collapsed: boolean[]; // collapsed state per section, index 0 = Assets
}
```

Defaults: `width = 250`, heights from `defaultHeight` in each section def, collapsed from `defaultCollapsed`.

Writes are debounced 500ms. If the stored `heights` or `collapsed` arrays have a different length than the current `sidebarSections` (e.g. after adding/removing a section), the stored data is discarded and defaults are used.

---

## Height Resize Math

All drag math lives in `calculateHeightResize()` in [`heightDragMath.ts`](./heightDragMath.ts). It is a pure function — no side effects, fully unit tested.

### Layout model

- Section 0 (Assets) is `flex: 1` — it claims all space not occupied by fixed sections.
- Fixed sections have explicit heights in `heights[]`.

### Constants

| Constant           | Value              | Meaning                                             |
| ------------------ | ------------------ | --------------------------------------------------- |
| `minSectionHeight` | 60px               | No fixed section can go below this                  |
| `minFirstHeight`   | `max(150px, 10vh)` | Assets must always retain at least this much height |
| `headerHeight`     | 28px               | Height of a collapsed section header                |
| `dragHandleHeight` | 4px                | Height of each drag handle bar                      |

### `handleIdx` mapping

`handleIdx` is the section index _above_ the handle (same as the rendered `i` in the section loop). Handle 0 sits between Assets and the first fixed section. Handle N sits between fixed sections N and N+1.

### Dragging DOWN (handle moves down)

The section above the handle **grows**. Space is taken from fixed sections **below the handle** in order, cascading forward until the delta is satisfied or all sections below are at their minimum. The flex section (Assets) is **never stolen from** when dragging down.

### Dragging UP (handle moves up)

The section below the handle **grows**. Space is taken from fixed sections **above the handle** in order (nearest first), cascading backward. Once all fixed sections above are at their minimum, Assets shrinks — i.e. the flex section absorbs the remainder. A growth cap prevents Assets from going below `minFirstHeight`.

### Handle 0 special case — collapse redirect

When handle 0 is dragged and the immediately adjacent fixed section (section 1) is **collapsed**, the drag is redirected to the first _expanded_ section below it. This is found with:

```ts
const firstExpanded = collapsedStates.slice(1).findIndex((c) => !c);
```

If that redirected target also hits its `minSectionHeight` while dragging down, the cascade continues forward through subsequent expanded sections (collapsed sections are skipped — their stored heights are frozen while collapsed).

---

## Edge Cases

### Cascading through multiple floored sections

When dragging a handle, if the immediately adjacent section reaches `minSectionHeight`, the remaining delta is passed on to the next section in the same direction. This continues until the delta is satisfied or there are no more sections to absorb it.

- **DOWN**: cascades forward (belowIdx → last).
- **UP**: cascades backward (aboveIdx → 0), then into flex.

### Collapse redirect + cascade

If handle 0 is dragged down and the redirect target (first expanded section) also floors, the cascade continues into the next expanded section — collapsed sections in the path are skipped. Their `heights[]` entries are **not mutated** while collapsed, preserving their saved height for when they're re-expanded.

### All fixed sections collapsed

If every fixed section is collapsed, handle 0 has nothing to redirect to. `calculateHeightResize` detects this (`targetIdx >= fixedCount`) and returns heights unchanged — the drag is a no-op.

### Flex section protection under multi-section UP cascades

The growth cap for an UP drag is:

```
maxGrowth = maxTotal - hBelowStart - (minSectionHeight × sectionsAbove) - afterSum
```

This accounts for _all_ sections above the handle potentially being at their minimum simultaneously. Without this, a large upward drag could grow the below section past what's available, starving Assets below `minFirstHeight`.

### localStorage reset on section count change

When sections are added or removed, the stored `heights` and `collapsed` arrays will have a different length. `useSidebarState` detects this length mismatch and silently falls back to defaults — no migration needed.

---

## Component Map

| File                                                 | Role                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| [`sectionRegistry.ts`](./sectionRegistry.ts)         | Section definitions — the only file to edit when adding a section       |
| [`heightDragMath.ts`](./heightDragMath.ts)           | Pure resize math, works for any N sections                              |
| [`heightDragMath.test.ts`](./heightDragMath.test.ts) | Unit tests covering all handle/direction/collapse combinations          |
| [`useSidebarState.ts`](./useSidebarState.ts)         | localStorage persistence, `toggleCollapse`, `resetHeights`              |
| [`useSidebarDrag.ts`](./useSidebarDrag.ts)           | Ref-based drag lifecycle, overlay, delegates to `calculateHeightResize` |
| [`SidebarSection.tsx`](./SidebarSection.tsx)         | Single section — header, content, drag handle                           |
| [`AssetSidebar.tsx`](./AssetSidebar.tsx)             | Root component — maps `sidebarSections`, owns no logic                  |

### Drag lifecycle

1. `mousedown` on a handle stores start data in `dragRef.current` — no re-render.
2. First `mousemove` sets `isDraggingRef = true` and lifts `activeDragKind` into state, rendering a full-screen transparent overlay (`position: fixed; inset: 0; z-index: 9999`) that captures all subsequent events and applies the correct cursor globally.
3. Further `mousemove` events compute new dimensions and call `patchStore`, which updates state and schedules a debounced localStorage write.
4. `mouseup` clears refs and removes the overlay.
