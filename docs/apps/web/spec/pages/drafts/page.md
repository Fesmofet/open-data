---
id: web-pages-drafts
title: Editor drafts
description: "- **query-api** (`/query/v1/users/:author/drafts`): list, create, patch, single delete, and **`POST .../drafts/bulk-delete`** with `{ draftIds: string[] }`. See user-post-drafts-endpoint.md. - **Web** calls the API from **server actions** in `apps/web/src/modules/editor/infrastructure/drafts.actions.ts` using the httpOnly access cookie as `Authorization: Bearer`. - **Initial draft load** (SSR): `fetchUserPostDraftForEditor` in `fetch-user-post-draft.server.ts` returns `draftId`, `title`, `body`…"
tags: [web, page, editor, drafts]
related:
  - docs/apps/web/spec/pages/editor/page.md
type: spec
status: active
scope: web
updated_at: 2026-06-10
---

# Editor drafts sidebar and autosave

**Back:** [overview](overview.md)

## Routes

| Path | Description |
|------|-------------|
| `/editor` | Compose post; optional query `?draftId=` or `?permlink=` (and legacy `?author=` must match session user). |
| `/drafts` | List all drafts with selection and bulk delete. |

## Data flow

- **query-api** (`/query/v1/users/:author/drafts`): list, create, patch, single delete, and **`POST .../drafts/bulk-delete`** with `{ draftIds: string[] }`. See [user-post-drafts-endpoint.md](../../query-api/spec/user-post-drafts-endpoint.md).
- **Web** calls the API from **server actions** in `apps/web/src/modules/editor/infrastructure/drafts.actions.ts` using the httpOnly access cookie as `Authorization: Bearer`.
- **Initial draft load** (SSR): `fetchUserPostDraftForEditor` in `fetch-user-post-draft.server.ts` returns `draftId`, `title`, `body`, `jsonMetadata`, `beneficiaries`, `permlink`, `lastUpdated` when opening by `draftId` or `permlink`.
- **Sidebar “Last drafts”**: first paint uses `fetchUserDraftListServer` with `limit: 5` on the editor page; list refreshes after successful save via `router.refresh()`.

## Hydration

- Sidebar and drafts list use **`HydrationSafeRelativeTime`** so “time ago” strings are not computed during SSR (avoids server/client clock skew). Navigational **`Link`**s use **`suppressHydrationWarning`** where browser extensions may alter `<a>` attributes.

## Autosave

- **Debounce:** 3 seconds after the last change to title, body, **tags**, **reward mode**, **beneficiaries**, or **linked objects**. Post editor body is **Lexical JSON** (`editorState.toJSON()` stringified). Legacy drafts that are plain text still load via paragraph seeding.
- **`jsonMetadata`:** PATCH replaces the whole JSON object on the server; the client merges `objects`, `tags`, and `_editorRewardMode` (editor-only; stripped before chain publish).
- **`beneficiaries`:** separate draft column `[{ account, weight }]` (Hive basis points); default row from `POST_EDITOR_DEFAULT_BENEFICIARY_*` env when starting a new post (see `getPostEditorDefaultBeneficiary`).
- **Create vs patch:** If there is no `draftId`, the first save that has non-empty title, body, or at least one linked object runs **POST** create, then `router.replace` to `?draftId=…`. Otherwise **PATCH** with `draftId`.
- **Flush:** On `pagehide`, `visibilitychange` to `hidden`, and component unmount, pending debounced work is cancelled and a final save runs if content differs from the last persisted snapshot.
- **Publish:** `useEditorPostPublish` flushes autosave, then broadcasts **`comment`** + **`comment_options`** (reward + beneficiaries); on success **`deleteUserDraftAction`** for the current `draftId` and redirect to `/@username` (author blog feed).

## `/drafts` page

- Loads pages of 20 drafts with cursor pagination (“Load more”).
- Master checkbox + per-row checkboxes; **Delete selected** and per-row **Delete** use `bulk-delete` (same API for a single id).
