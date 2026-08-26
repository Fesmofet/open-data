---
id: web-pages-object-routes-gallery
title: Object page — Gallery tab
description: "Center-column Gallery tab at `/object/:id/gallery` and album drill-down. On-chain albums from resolve; virtual Related album from post json_metadata.image."
tags: [web, page, object, gallery]
related:
  - docs/apps/web/spec/pages/object/page-shell.md
  - docs/apps/web/spec/pages/object/navigation.md
  - docs/apps/query-api/spec/object-related-album.md
type: spec
status: active
scope: web
updated_at: 2026-06-17
---

# Object page — Gallery tab

**Back:** [web overview](../../overview.md) · **Related:** [navigation.md](../navigation.md), [edit-mode.md](edit-mode.md), [object-related-album.md](../../../../../query-api/spec/object-related-album.md)

## Scope

Center-column Gallery tab at `/object/:id/gallery` and album drill-down at `/object/:id/gallery/album/:album_name`.

- **On-chain albums** — `galleryAlbums` from object resolve (`imageGallery` / `imageGalleryItem`).
- **Virtual Related album** — post `json_metadata.image` URLs linked via `post_objects` (eligible object types only). Not on-chain gallery data.

---

## URLs

| Visible URL | Center column |
|---|---|
| `/object/:id/gallery` | Album cards grid + **Related** card when eligible type has post images |
| `/object/:id/gallery/album/:name` | Single album photo grid (`:name` is `encodeURIComponent` of album name; `Related` is virtual) |

Proxy (`apps/web/src/proxy.ts`) rewrites album paths **before** plain `/gallery`:

```
/object/:id/gallery/album/:album → /object/:id?tab=gallery&gallery_album=:album
/object/:id/gallery             → /object/:id?tab=gallery
```

Client navigation uses `buildObjectGalleryPath` / `buildObjectGalleryAlbumPath` in `object-page-url.constants.ts`. Active album sync: `resolveGalleryAlbumForObjectPage` (pathname preferred, then `?gallery_album=`).

---

## Data

| Field | Source | Web mapping |
|---|---|---|
| `galleryAlbums` | query-api resolve (`build-gallery-albums.ts`) | `ObjectPageViewModel.galleryAlbums` via `projectedGalleryAlbums()` |
| `rankScore` | `object_updates.rank_score` on each `imageGalleryItem` | `ProjectedGalleryPhotoView.rankScore` — decisive rank (winner semantics) |
| `viewerRank` | `rank_votes` for `(update_id, X-Viewer)` | `ProjectedGalleryPhotoView.viewerRank` — viewer’s latest rank vote |
| Related preview | `GET .../gallery/related/preview` | `relatedAlbumPreview` (SSR when landing on gallery tab; client fetch otherwise) |
| Related list page | `GET .../gallery/related` | `relatedAlbumInitialPage` (SSR when `gallery_album=Related`; client fetch in `ObjectRelatedAlbumSection`) |

Zod: `projectedObjectViewSchema.galleryAlbums` in `feed-story.dto.ts`; Related responses in `related-album.types.ts`.

---

## UI

### Albums list (`ObjectGalleryTabContent`, `activeAlbumName === null`)

- Toolbar: **Add new album** (guests → sign-in modal).
- Grid of on-chain album cards: cover = first item URL or placeholder; label `{name} ({count})`.
- **Related** card when `isObjectTypeEligibleForRelatedAlbum` and preview `count > 0`; skeleton while client preview loads.
- Fetch errors show retry affordance (not treated as empty album).

### Related album (`ObjectRelatedAlbumSection` → `ObjectRelatedAlbumContent`)

- Infinite scroll via `loadMoreObjectRelatedAlbumAction`.
- Skeleton grid while first page loads without SSR data.
- Error state with back link when fetch fails.

### On-chain album detail (`ObjectGalleryTabContent`, `activeAlbumName` set)

- Toolbar: **Back to albums**, **Add new image**.
- 2-column photo grid with per-item loading skeleton (`GalleryImage`) or video poster (`VideoPreviewPlayer` when the item URL is YouTube, Vimeo, 3Speak, or DTube).
- Empty / unknown album: `gallery_list_empty` + back link.

### Full-screen viewer (`ObjectGalleryViewer`)

- Opened from photo grid on object page layer.
- Video URLs: poster + inline iframe playback; zoom and **Set as avatar** are hidden for video items.
- Related album: `isVirtualRelatedAlbum` — hides vote/add controls; shows post author link.
- On-chain photos (non-avatar, with `update_id`): footer shows validity vote controls plus **Set gallery rank** button → **`GalleryRankModal`** (slider 0–10000, step **100**, default max; Confirm broadcasts `rank_vote`). Read-only **Current rank** shows decisive `rank_score` (winner semantics, not average). Guests are prompted to sign in on trigger click. While rank modal is open, gallery viewer ignores Escape. See [vote-semantics.md](../../../../../../spec/vote-semantics.md) §B.
- **`imageGalleryItem` update cards** on the object Updates tab use the same **Set gallery rank** button + modal (including items without image preview URLs).

Wired from `ObjectPrimaryContent` when `activePrimarySegment === 'gallery'`.

---

## Add modals

Uses `AddUpdateModal` (`mode: 'generic'`):

| Action | `updateType` | `initialValue` |
|---|---|---|
| Add album | `imageGallery` | `''` (album name text) |
| Add image (in album) | `imageGalleryItem` | `{ album, url: '', cid: '' }` with `lockGalleryAlbum: true` |

After broadcast: `revalidateObjectAfterBroadcast` + router refresh (modal default).

---

## Out of scope (this feature)

- Drag-and-drop multi-upload
- Hiding Gallery tab when no albums exist
- Related photos merged into description / sidebar / `previewGallery` (legacy parity — see [navigation.md](../navigation.md))
