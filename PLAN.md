# GrapesJS Studio: Per-Page File Storage & Scalable Architecture

> **Status:** Planning / Pre-implementation
>
> **Goal:** Replace the single monolithic project JSON with a scalable, file-based project layout (manifest + per-page JSON + symbols) backed by Struxt's Hybrid File System (HFS), paired with generated HTML/CSS in `/public` for the file explorer and publishing.
>
> **Note:** Items marked **(verify)** are assumptions about GrapesJS / Studio SDK behavior that must be confirmed with a quick experiment before building on them. The persisted format may differ from the SDK payload, but the load/save adapter and migration must preserve the complete editor data.

## 1. Overview & Goals

A scalable, multi-page site-builder architecture built on GrapesJS / Studio SDK within Struxt, designed to handle large sites (e.g., e-commerce stores with hundreds of pages) without performance degradation. It features an integrated file explorer for assets, global configuration, and lazy-loaded individual pages.

### Core Objectives

- **Per-Page Storage via `assetId`:** Store each page as its own isolated file keyed by Struxt's globally unique `AssetModel.uuid` (called `assetId` in this plan), rather than mutable page slugs or client-side GrapesJS `pageId`s.
- **Full Editor Fidelity:** Preserve the complete Studio page object and all non-page project data, including frames/components, traits, IDs, symbols, data sources, and project settings. Structured JSON is the single source of truth for the visual editor.
- **Clean Publishable Output in `/public`:** Generate readable per-page `.html` and adjacent `.css` files alongside `global.css` inside `/public` so the file explorer displays clean output and only `/public` needs to be published.
- **Separation of Concerns & Global Code Injection:** Keep non-page project settings (including site-wide injected `<head>` tags/scripts, meta tags, and end-of-`<body>` scripts/snippets), user-designated global styles (`/public/global.css`), and reusable components/symbols separate from individual pages.
- **Change-Aware Saves:** Compare editor data with the last server-confirmed state and send updates only when values change. Send the full non-page project data when it changes, without page details; persist changed page data separately. The server owns and rebuilds the page registry from stored page records.
- **Single-Round-Trip Page Loading:** Assemble the manifest, symbols, and target page data on the server into a single API response to minimize client-server round trips.
- **High Scalability:** Support projects with hundreds of pages by loading and keeping only the active page in memory, unloading inactive pages on navigation.
- **Portability:** Maintain an on-disk format that remains completely portable if Studio SDK is later replaced by a custom editor built directly on open-source GrapesJS.

## 2. Scope & Non-Goals (For Now)

- **Raw-HTML & External Code Editing:** Out of scope for v1. GrapesJS manages the structural markup and JSON remains the sole source of truth; hand-editing or raw HTML editing is not supported.
- **Custom Symbols Explorer Tab:** Building a dedicated custom symbols tab or UI view in the file explorer is out of scope for this change. Symbols continue to work natively inside the GrapesJS editor and persist via `.studio/symbols/{symbolId}.json`.
- **Serverless Functions Runtime:** The root layout reserves a `/functions` directory for future use, but no execution runtime is being built in this phase.

## 3. Key Architectural Decisions

| #   | Decision                                     | Rationale & Notes                                                                                                                                                                                                                     |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **JSON as Source of Truth (v1)**             | Structured JSON in `.studio/` preserves editor state; generated per-page `.html`, adjacent `.css`, and `global.css` are written into `/public`. Publishing copies `/public`; the publish request does not send files from the client. |
| 2   | **`assetId` and `pageId` Identity**          | `assetId` is the existing Struxt `AssetModel.uuid`; it is the stable page-file key. `pageId` remains the client-generated GrapesJS page identifier and is preserved inside the page data. |
| 3   | **Asset Model Tracking**                     | Add `studio: boolean = false` and `readOnly: boolean = false` to `AssetModel`. `studio` identifies files managed by GrapesJS Studio; `readOnly` protects generated output. `assetId` is the existing `AssetModel.uuid`. |
| 4   | **Root Directory & `/public` Isolation**     | `.studio/`, `functions/`, and `public/` sit at the Struxt project files root (`getProjectFilesDir(projectId)`). Only items inside `/public` are published. |
| 5   | **Role-Based `.studio/` Visibility**         | Editor-owned JSON files live in `.studio/` (`manifest.json`, `pages/`, `symbols/`). All `.studio/` files are visible as **read-only** to standard users, while **Struxt Admins** can edit them directly via the built-in text editor. |
| 6   | **Central Manifest & Global Code Injection** | `.studio/manifest.json` holds all non-page project data, including global settings, user-designated global styles, and a server-maintained page registry. The client never replaces the registry with a partial page list. |
| 7   | **Global Symbol Store**                      | Reusable components/symbols are stored individually at `.studio/symbols/{symbolId}.json` so they can be shared across pages without duplication.                                                                                      |
| 8   | **User-Controlled Style Scope**              | A Studio plugin lets users choose whether each style rule is global or page-local. Global rules are stored in the manifest and compiled into `public/global.css`; page-local rules are stored with their page and compiled into its adjacent stylesheet. Migration uses a heuristic only for legacy projects: mark a rule global when its selectors contain no `#` and the rule is used on multiple pages; otherwise keep it page-local. |
| 9   | **Single-Page Memory Model**                 | Pages are lazy-loaded one at a time. Switching pages saves, unloads (`editor.Pages.remove()`), and clears undo history before loading the target page.                                                                                |
| 10  | **Change-Aware Server Merges (v1)**           | The client sends a full non-page project-data payload only when that data changes, and sends changed page data separately. The server persists these independently and rebuilds the page registry from page records. This avoids overwriting the registry from a partial editor payload; conflict handling for simultaneous changes to the same data remains a separate decision before collaboration. |

## 4. On-Disk Directory Layout & Output Routing

```text
<project-files-root>/             # Struxt getProjectFilesDir(projectId)
├── .studio/                      # Source of truth (read-only for standard users; editable by Struxt Admins)
│   ├── manifest.json             # Non-page project data, user-designated global styles, server-maintained page registry
│   ├── pages/
│   │   ├── {assetId-1}.json      # Full Studio page object + page-local styles; assetId is AssetModel.uuid
│   │   └── {assetId-2}.json
│   └── symbols/
│       └── {symbolId}.json       # Global store for reusable components/symbols
├── public/                       # ONLY items in /public are published
│   ├── global.css                # GENERATED from styles explicitly designated global by the user
│   ├── contact-us/               # Example trailing-slash slug: "/contact-us/"
│   │   ├── index.html            # GENERATED page HTML
│   │   └── contact-us.css        # GENERATED adjacent stylesheet for page-local styles
│   ├── about.html                # Example non-trailing-slash slug: "/about"
│   ├── about.css                 # GENERATED adjacent stylesheet for page-local styles
│   └── assets/                   # User assets (managed via file explorer)
└── functions/                    # Reserved for future serverless functions
```

### Slug & Output Routing Rules

- **Publish Root (`/public`):** All generated web outputs (`global.css`, page HTML, adjacent page CSS) and static `assets/` live inside `public/`. Only `public/` is deployed during publishing.
- **Editor Display Format:** Inside GrapesJS, page slugs always normalize and display cleanly without file extensions (e.g., `/contact-us/`).
- **Trailing Slash (`/`):** If a page slug ends with a trailing slash (e.g., `/contact-us/`), output routes to a directory index inside `public/` with an adjacent stylesheet:
  - Disk HTML: `public/contact-us/index.html` (served at `/contact-us/`)
  - Disk CSS: `public/contact-us/contact-us.css` (linked at `/contact-us/contact-us.css`)
- **No Trailing Slash:** If a page slug omits the trailing slash (e.g., `/contact-us`), output routes to a flat file inside `public/` with an adjacent stylesheet:
  - Disk HTML: `public/contact-us.html` (served at `/contact-us.html`)
  - Disk CSS: `public/contact-us.css` (linked at `/contact-us.css`)
- **Generated File Protection:** Generated files (`public/**/*.html`, `public/**/*.css`, `public/global.css`) should be treated as read-only output in the file explorer (and/or include a warning banner comment) so users do not edit generated artifacts expecting changes to persist back into the visual editor.

## 5. File Formats & Data Models

> The exact keys in the Studio project JSON must be confirmed by logging a real `onSave` payload before implementation. **(verify)**

### `AssetModel` Extension

```ts
interface AssetModel {
  // ...existing Struxt asset fields
  studio: boolean; // Default: false. True for files managed by GrapesJS Studio.
  readOnly: boolean; // Default: false. True for generated output.
}
```

`assetId` in this plan is the same identifier as `AssetModel.uuid`; it is not a second ID. Continue to preserve GrapesJS's separate client-side `pageId`.

### `.studio/manifest.json`

```json
{
  "version": 1,
  "globalData": {
    "...": "all non-page Studio project data, including existing project settings"
  },
  "globalStyles": [],
  "pages": [] // server-maintained registry derived from stored page records
}
```

- `globalData`: The complete non-page project payload needed by the editor, including existing global/page settings, data sources, and other non-page fields captured from the SDK. Handle asset records according to Struxt's existing asset model rather than silently dropping editor data.
- `globalStyles`: Only rules explicitly designated global by the user. Persist the scope metadata needed to restore each rule's global/page-local choice.
- `pages`: The registry used to drive the sidebar file explorer UI, keyed by `AssetModel.uuid`. The server derives or maintains it from `.studio/pages/*.json`; never accept a partial client page list as the replacement.

The client sends the full non-page project payload, including style-scope choices and symbol data, without `pages` when any global value changes. The server partitions that payload into `globalData`, `globalStyles`, and individual symbol files. Page details are saved separately, and the server derives or maintains the registry from those page records.

### `.studio/pages/{assetId}.json`

```json
{
  "version": 1,
  "assetId": "ast_9f8e7d6c5b",
  "slug": "/contact-us/",
  "page": {
    "id": "page-abc123",
    "name": "Contact Us",
    "frames": []
  },
  "styles": []
}
```

- `assetId`: The page's existing `AssetModel.uuid` (primary lookup key).
- `slug`: Struxt routing metadata used to derive the page registry and generated output paths.
- `page`: The complete Studio/GrapesJS page object, not a reduced `component` projection. Preserve its frames, page ID, settings, and other SDK fields through load/save and migration.
- `styles`: The rules explicitly designated page-local. Do not infer scope from selector shape during normal saves.

### `.studio/symbols/{symbolId}.json`

Global component store (one symbol definition per file). IDs of elements inside a symbol likely belong within the symbol file rather than the host page file. **(verify)**

## 6. User-Controlled Style Scope & Purging Prevention

GrapesJS manages styles project-wide in memory, so the editor plugin must persist each rule's user-selected scope and restore it during load. Users decide which rules are global; `#id` selectors are not automatically classified as page-local during normal editing. Warn about potential selector collisions when useful, but do not silently override the user's scope choice.

| Rule Scope                 | Stored In                                | Compiled Output              |
| -------------------------- | ---------------------------------------- | ---------------------------- |
| User-designated global     | `.studio/manifest.json` → `globalStyles` | `public/global.css`          |
| User-designated page-local | `.studio/pages/{assetId}.json` → `styles` | Adjacent `public/<slug>.css` |
| Unused rule                 | Preserve unless the user removes it      | Follow its saved scope       |

### Legacy Style Scope Migration

For a legacy monolithic project, automatically mark a style rule global only when it has no `#` in its selector and is used on multiple pages. Keep other legacy rules page-local. Confirm how rule usage is determined from the real SDK payload, preserve every rule, and allow the user to change the migrated scope afterward. This heuristic is for migration only; new or edited rules use the user's explicit choice.

### Style Purging Check

Manually verify whether GrapesJS strips unused CSS rules during save/export and whether the plugin's scope metadata survives project serialization. Preserve scoped rules even when they are unused on the active page; use the SDK's supported APIs or stored scope metadata rather than inferring scope on every save.

## 7. Core Workflows

### A. Single-Call Load Flow (`onLoad` & Page Fetch)

Configure `storage.type: 'self'` with both `onLoad` and `onSave` defined (keeping `project.default` as a fallback). To eliminate extra network round trips, a single server API endpoint reads and assembles all required payloads before responding to the client.

```text
editor onLoad (or page switch fetch for target assetId)
  └─ GET /api/studio/pages/{assetId} (single API call)
       ├─ Server reads .studio/manifest.json
       ├─ Server reads all .studio/symbols/*.json
       ├─ Server reads .studio/pages/{assetId}.json
       └─ Returns assembled payload:
            { manifest, symbols, page }
  └─ Client initializes/updates editor:
       { project: { ...manifest.globalData, styles: manifest.globalStyles, symbols, pages: [page] } }
```

### B. Save Flow (`onSave`) & HFS Persistence

Because only one page is loaded in memory, `onSave` receives a **partial** project. Compare the active page and the non-page project data with the last server-confirmed snapshots. Save changed page data separately; when any non-page data changes, send the full non-page payload without `pages`. Do not send unchanged values or let the client replace the server-owned page registry. The server derives or rebuilds that registry from stored page records.

All writes go through Struxt's HFS path-safety helpers. Extend the write helper to support atomic replacement for ordinary files as well as streams; do not assume the current direct `hfsWriteFile` implementation is atomic.

```text
editor onSave({ project, editor })
  ├─ compare the active full SDK page object and its page-local styles with the last confirmed values
  ├─ if changed, generate page HTML/CSS and save the page data and generated output
  ├─ compare full non-page project data (including user-selected global styles) with the last confirmed values
  └─ if changed, send the full non-page payload without pages; skip the request if unchanged

server page save
  ├─ validate project access, AssetModel.uuid, page data, and slug
  ├─ atomically write .studio/pages/{uuid}.json and generated public output
  ├─ update/rebuild the manifest page registry from stored page records
  └─ update corresponding AssetModel records

server global-data save (only when the client reports a changed snapshot)
  ├─ validate and atomically write the full non-page data to .studio/manifest.json
  ├─ preserve/rebuild the page registry from stored page records; ignore client page details
  ├─ write user-designated global styles to public/global.css
  └─ regenerate affected pages' HTML/CSS if global settings or styles changed
```

_Note on CSS generation:_ Build `global.css` and adjacent `<slug>.css` from the saved scope assignments, using verified SDK serialization or a server-side serializer for the rule JSON. Do not infer rule scope from selector type during regular saves. **(verify)**

### C. Page Switching Lifecycle (Single-Page Memory Model)

The custom sidebar file explorer is driven strictly by `manifest.pages` (keyed by `assetId`), not `editor.Pages.getAll()`.

1. **Trigger:** User selects a different page (`targetAssetId`) in the custom file explorer.
2. **Flush & Autosave:** Flush any pending autosave for the active page and wait for confirmation.
3. **Single-Call Fetch:** Request assembled target page data (`GET /api/studio/pages/{targetAssetId}`) in one round trip.
4. **Load & Select:** Inject the target page and its saved page-local styles via `editor.Pages.add()` (and the verified CSS API if needed), restore its style-scope metadata, and switch focus via `editor.Pages.select()`. _(GrapesJS requires at least one page active, so always add and select before removing.)_
5. **Unload:** Call `editor.Pages.remove(previousPageId)` to free browser memory.
6. **Reset History:** Clear the UndoManager history (`editor.UndoManager.clear()`) so undo operations cannot reference unloaded components.
7. **Guard Autosave:** Suppress autosave triggers caused by the programmatic add/remove calls during the switch.

## 8. Verification & Test Plan (Pre-Build)

Run these quick validation tests before building out the full backend:

1. **Test 1 — Scope Metadata Persistence:** Use the plugin to mark rules global and page-local, save, switch pages, reload, and confirm the choices and rendered styles are preserved, including unused rules.
2. **Test 2 — Legacy Style Migration:** Confirm that legacy rules with no `#` in their selectors and usage on multiple pages migrate as global; other rules remain page-local and can be changed by the user afterward.
3. **Test 3 — Full Page-Object Round-Trip:** Save and reload a page with multiple frames and page settings. Verify the complete SDK page object, including frame component trees and IDs, survives without flattening or loss.
4. **Test 4 — Global/Local Style Output:** Verify user-designated global rules appear in `public/global.css`, page-local rules in the owning page stylesheet, and changes to global data regenerate affected outputs.
5. **Test 5 — Change-Aware Save & Registry:** Confirm unchanged snapshots trigger no request; changed global data sends the full non-page payload without pages; page saves update the server-derived registry without dropping other pages.
6. **Test 6 — Page Switching Stress Test:** Test rapid page switching, switching with dirty/unsaved changes, undo behavior post-switch, and autosave suppression during transitions.
7. **Test 7 — Real Payload Inspection:** Log `onSave` and `editor.getProjectData()` outputs to confirm exact SDK fields, the full non-page payload, style-scope metadata, and the mapping between `AssetModel.uuid` and GrapesJS `pageId`.
8. **Test 8 — Legacy Project Migration:** Migrate a representative existing project and verify settings, symbols, data sources, assets, pages, and styles are preserved.

## 9. Implementation Roadmap

### Phase 0: Verify Assumptions

- [ ] Log real `onSave` payload and `getProjectData()` output; document the full page object and all non-page fields to preserve
- [ ] Verify how user-selected style scope can be stored, restored, and retained for unused rules
- [ ] Verify the legacy migration heuristic for styles without `#` that are used on multiple pages
- [ ] Confirm how `Pages.add()` handles page-local styles and style metadata in Studio SDK vs core GrapesJS
- [ ] Verify change detection against the last server-confirmed snapshot and ensure full global payloads omit `pages`

### Phase 1: Storage Backend API & Data Models

- [ ] Add `studio: boolean = false` and `readOnly: boolean = false` properties to `AssetModel`; use `AssetModel.uuid` as the page `assetId`
- [ ] Initialize root directory structure (`.studio/`, `public/`, `functions/`) via Struxt HFS
- [ ] Extend the HFS write helper to atomically replace ordinary files as well as streams
- [ ] Build single-call page assembly endpoint (`GET /api/studio/pages/{assetId}`) returning non-page data, symbols, and the full page object in one round trip
- [ ] Build page and global-data save endpoints keyed by `AssetModel.uuid`; global saves accept full non-page data only, and the server derives/maintains the page registry from stored page records
- [ ] Build global component/symbol CRUD endpoints (`.studio/symbols/{symbolId}.json`)
- [ ] Implement slug validation, extension stripping for GrapesJS display, and `/public` output path resolution (`public/slug/index.html` vs `public/slug.html` + adjacent `slug.css`)

### Phase 2: Editor Integration & Output Generation

- [ ] Implement `onLoad` using the single-call assembled payload endpoint
- [ ] Implement change-aware `onSave`: compare page and non-page snapshots with the last server-confirmed state; send changed page data separately and send full non-page data (without pages) only when changed
- [ ] Build a Studio plugin that lets users mark style rules global or page-local and persists/restores those choices
- [ ] Implement the legacy-only style migration heuristic; keep non-global rules page-local and allow users to change migrated choices
- [ ] Test style scope migration, persistence, full page-object round trips, change detection, and server-side page-registry reconstruction
- [ ] Implement `public/global.css`, adjacent `public/<slug>.css`, and HTML generation with automatic global/page stylesheet linking and `<head>` / end-of-`<body>` code injection

### Phase 3: Custom File Explorer & Navigation

- [ ] Build custom sidebar file explorer UI driven by `manifest.pages` (`assetId`) and `public/assets/`
- [ ] Enforce role-based permissions on `.studio/` files (read-only for standard users; writable in built-in text editor for Struxt Admins)
- [ ] Implement single-page lazy-load & unload switch lifecycle (flush, single-call fetch, add, select, remove, clear undo)
- [ ] Wire up Create / Rename / Duplicate / Delete page actions (creating/updating Struxt `AssetModel` records with `studio = true`)

### Phase 3.5: Publishing Pipeline Update

- [ ] Remove generated file payloads from the client publish request; publish the already-generated project `/public` tree only
- [ ] Ensure the publish pipeline copies the new `/public` output layout (`global.css`, `slug/index.html` or `slug.html`, adjacent `slug.css`, and `assets/`) and never publishes `.studio/` or `functions/`

### Phase 4: Polish & Hardening

- [ ] Implement content-hash checks in HFS writes to skip rewriting unchanged files on autosave
- [ ] Mark generated files (`public/**/*.html`, `public/**/*.css`, `public/global.css`) as read-only in the file explorer
- [ ] Build migration script to convert legacy monolithic project JSONs into the `.studio/` + `public/` layout without losing page frames, settings, symbols, data sources, assets, or styles
- [ ] Add save error handling, retry logic, and user status indicators

## 10. References

- Studio SDK Storage & Export Docs: https://app.grapesjs.com/docs-sdk/configuration/projects#storage
- `studio:projectFiles` command (page HTML + CSS generation; options: `styles`, `filenameCss`, `skipProject`)
- Core GrapesJS APIs: `editor.getProjectData()`, `editor.loadProjectData()`, `editor.Pages`, `editor.Css`, `editor.UndoManager`, `editor.getHtml()`, `editor.getCss()`
