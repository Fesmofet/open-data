# Post editor (`/editor`)

**Back:** [web overview](overview.md) · **Related:** [architecture](architecture.md), [auth](auth.md), [app-header](app-header.md)

## Purpose

Authenticated screen for composing a post: title field and rich body using **Lexical** (`lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/list`, `@lexical/link`). Legacy Waivio behavior (draft list, campaigns, linked objects, Slate) is described in [`tmp/editor-page.md`](../../../../tmp/editor-page.md) and is **not** implemented in the MVP; extend with application queries and server actions when APIs exist.

## Route and access

| Item | Detail |
|------|--------|
| Path | `/editor` — [`apps/web/src/app/(app)/editor/page.tsx`](../../../../apps/web/src/app/(app)/editor/page.tsx) |
| Auth | Server Component calls `createCookieAuthContextProvider().getUser()`; if `null`, `redirect('/')`. Unauthenticated users cannot view the editor. |
| Entry | Logged-in **write** icon in [`LoggedInHeaderActions`](../../../../apps/web/src/modules/app-header/presentation/components/logged-in-header-actions.tsx) → `/editor`. |

## Implementation

| Area | Detail |
|------|--------|
| Module | [`apps/web/src/modules/editor/`](../../../../apps/web/src/modules/editor/) — `EditorScreen`, `LexicalPostEditor`, insert overlay, format toolbar, **`EditorAttachedObjectsPanel`**; domain `format-actions`, `SpoilerNode`, `post-editor-linked-object`; drafts in infrastructure. |
| Layout | Main column uses **`max-w-container-content`** (not `container-narrow`). |
| UI | Design tokens (see [theme.md](theme.md)); body placeholder uses i18n `story_placeholder`; page title from `editor` in `generateMetadata`. |
| Insert menu | **+** is outline-only (`bg-bg`, border), centered on the **left border** (`-translate-x-1/2`), and **tracks the caret line** (collapsed-range safe geometry via `getCaretLineViewportRect`, double `requestAnimationFrame` after Lexical updates, `selectionchange`, `keyup`/`input`/`click` on root). Opens a dialog (title + grid + search; no header close button). Actions disabled until Lexical/node wiring; search is UI-only. i18n: `editor_insert_*`, `editor_search_object_by_name`. |
| Format toolbar | Floating bar (`EditorFormatToolbar`) on **non-compact** editors when the user selects text (hidden on collapsed/zero-width selection). Primary: Bold, Italic, Link, More (…). More menu driven by `MORE_ACTIONS` in `domain/format-actions.ts` (H1–H3, Quote, inline code, Spoiler, Mention stub). Positioned above selection via `createPortal` + `position: fixed`; `onMouseDown` `preventDefault` preserves selection. Link opens inline URL field with editor-state snapshot restore on cancel. i18n: `editor_format_*`. |
| Images | **Non-compact** editor only: paste image file (`EditorPasteImagePlugin`), drag-drop on editor shell (`EditorImageDropOverlay`), Insert → Photo (`EditorInsertPhotoPanel` + shared `IpfsImageDropZone`). Upload via `uploadImageToIpfs` / `uploadImageFromUrl`; `ImageNode` stores `cid` + `src`. Draft `body` is Lexical JSON. Hive markdown export at publish: follow-up. |
| Linked objects | Below the editor: search (`/api/search` via `fetchObjectSearchResults`), **Create new object** → `/object-create`, cards with toggle (detach) and percent slider. State persisted in draft **`jsonMetadata.objects`** as `[{ object_id, percent }]` (sum **100** across attached rows; equal split on add/remove). See [post-json-metadata-objects.md](../../../spec/data-model/post-json-metadata-objects.md). Autosave: [editor-drafts.md](editor-drafts.md). |
| i18n | Document title uses locale messages via `getRequestLocale` + `loadMessages`. Keys: `editor_search_elements`, `editor_search_object_by_name`, `editor_linked_objects`, `create_new_object`, `linked_objects_remaining`. |

## MVP limits

- No publish, preview, or Hive broadcast (`jsonMetadata.objects` is stored on drafts only until publish wires chain metadata).
- Insert grid items except **Photo** do not insert content yet (placeholders).

## Verification

Open `/editor` logged out → redirect to `/`. Logged in → editor UI; header write icon navigates to `/editor`.
