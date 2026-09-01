---
id: web-layout-system
title: Layout system
description: This spec describes **structural** layout only (zones, breakpoints, scroll/sticky behavior). It does **not** cover colors, shadows, or domain data loading.
type: spec
status: active
scope: web
tags: [web, layout]
updated_at: 2026-09-01
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/shell-mode.md
---

# Layout system

**Back:** [web overview](overview.md) · **Related:** [architecture](architecture.md), [theme](theme.md)

This spec describes **structural** layout only (zones, breakpoints, scroll/sticky behavior). It does **not** cover colors, shadows, or domain data loading.

## Goals

- **Shells** — which outer chrome applies (app, public, immersive) via Next.js **route groups**.
- **Regions** — reusable wrappers (`StickyRegion`, drawers) for rails and sidebars.
- **Content arrangements** — inner layout of the primary column (`FeedColumn`, `CardGrid`, `MasonryGrid`, `CenteredArticle`).
- **Layout state** — `LayoutProvider` for client-only UI (sidebar toggles, feed vs grid mode) without a global store.
- **Shell mode** — optional `data-shell-mode` presets that override structural tokens (rail widths, card rhythm); see [shell-mode.md](shell-mode.md).

## Where to look

| Path | Role |
| ---- | ---- |
| `apps/web/src/shared/presentation/layout/` | Barrel exports: shells, regions, arrangements, `LayoutProvider`, `BREAKPOINTS` |
| `apps/web/src/shell-mode/` | Shell mode types, cookie, resolution, `ShellModeProvider` (see [shell-mode.md](shell-mode.md)) |
| `apps/web/src/app/(app)/dev/showcase/page.tsx` | Dev **showcase** — layout primitives, switchers, token sampler (`/dev/showcase`) |
| `apps/web/src/app/(app)/layout.tsx` | `LayoutProvider` + `AppShell` + [`AppHeader`](app-header.md) / `BottomNav` |
| `apps/web/src/app/(public)/layout.tsx` | `PublicShell` — centered narrow column |
| `apps/web/src/app/(immersive)/layout.tsx` | `ImmersiveShell` — fullscreen, no chrome |
| `apps/web/src/app/(app)/user-profile/[name]/layout.tsx` | Validates `[name]` for all routes under the profile URL family |
| `apps/web/src/app/(app)/user-profile/[name]/(profile)/layout.tsx` | Profile hero, primary nav band, gray content band + nested `children` |
| `apps/web/src/app/(app)/user-profile/[name]/(profile)/(main)/layout.tsx` | Default profile tabs: three-column **lg+** rail + main (submenu + feed) + rail |
| `apps/web/src/app/(app)/user-profile/[name]/(profile)/about/layout.tsx` | About: main + right rail only |
| `apps/web/src/app/(app)/user-profile/[name]/(profile)/map/layout.tsx` | Map: single column |
| `apps/web/src/app/(app)/user-profile/[name]/(profile)/transfers/waiv-table/layout.tsx` | Waiv table: single column |

Route groups `(app)`, `(public)`, `(immersive)` do **not** appear in URLs.

## Shells

| Component | Use when |
| --------- | -------- |
| `AppShell` | Standard app pages: optional `header`, `leftNav`, `rightRail`, `bottomNav`, primary `children`. Grid columns use `--shell-left-width` / `--shell-right-width` at `lg+`. |
| `PublicShell` | Marketing / auth-style centered content (`max-w-container-narrow`). |
| `ImmersiveShell` | Full-screen experiences (compose, media viewer). |

Override grid with `gridTemplateClassName` on `AppShell` when a route needs a non-default column template.

## Regions

| Component | Behavior |
| --------- | -------- |
| `StickyRegion` | `position: sticky` with configurable `offset` (CSS length). |
| `FixedRegion` | Sticky + `h-[100dvh]` + `overflow-y-auto overflow-x-hidden` (twitter-mode left rail). |
| `CollapsibleRegion` | Client: toggle on small screens; always visible on `lg+`. Optional `localStorage` via `storageKey`. |
| `DrawerRegion` | Client: fixed overlay + panel; backdrop and `Escape` close. |
| `ShellInset` | Constrained app column (`max-w-container-page` + `px-gutter`). Use for chrome and hero content that must align with the main grid. |
| `ShellFullBleedBand` | Viewport-width background band; `breakout` (default) escapes a constrained parent for profile/object heroes; `breakout={false}` when already outside the page column (rare). Do not wrap in `overflow-hidden` ancestors — breakout is clipped. Inside an app column, do **not** nest `ShellInset` (content is already guttered). |

### App header sticky slot

`AppShell` renders an optional `header` **outside** `max-w-container-page`: `sticky top-0` wrapper (no top inset by default; pass `headerTopInset={true}` for scroll-away `pt-section-y-sm`). `AppHeader` is `w-full` at shell level with `ShellInset` for `TopNav`. Page content grid has no top margin — flush below the header.

## Content arrangements

| Component | Behavior |
| --------- | -------- |
| `FeedColumn` | `flex flex-col gap-card-padding` — single-column feeds and lists. |
| `CardGrid` | Responsive CSS grid; `columns` per breakpoint (`base`, `sm`, …). Dynamic column classes are **safelisted** in `tailwind.config.js`. |
| `MasonryGrid` | CSS `columns` with `column-gap` token; children may need `break-inside-avoid`. |
| `CenteredArticle` | `max-w-container-content` centered article column. |

### Switching arrangements (Layout context)

Use `useLayout().setContentArrangement` to switch between `feed`, `grid`, and `masonry` for client-driven profile or feed UIs. This is **UI state** only — route-level shells and CSS grids still own the outer frame.

## Shell mode

Structural presets (`default`, `twitter`, `instagram`, `compact`) set `data-shell-mode` on `<html>` and override tokens such as `--shell-left-width` / `--spacing-card`. Full flow and how to add a mode: [shell-mode.md](shell-mode.md).

## Breakpoints

`BREAKPOINTS` in `shared/presentation/layout/breakpoints.ts` matches Tailwind defaults (`sm` … `2xl`) as CSS length strings for `useMediaQuery` and documentation.

## Layout presets (documentation)

`PROFILE_LAYOUT_PRESETS` in `modules/user-profile/presentation/layout-presets.ts` documents **valid combinations** of arrangement + sidebar flags for profile-style pages. It is **not** wired into the layout runtime — use as a reference for agents and implementers.

## Showcase page

Visit **`/dev/showcase`** for live examples: shells, regions, arrangements, `ThemeSwitcher`, `ShellModeSwitcher`, `LocaleSwitcher`, and a token sampler.

## Layout context

`LayoutProvider` wraps `apps/web/src/app/(app)/layout.tsx`. Consumers use `useLayout()` from `@/shared/presentation/layout` for:

- `leftNavOpen` / `toggleLeftNav`
- `rightRailOpen` / `toggleRightRail`
- `contentArrangement` / `setContentArrangement` (`feed` | `grid` | `masonry`)

Throws if used outside `LayoutProvider`.

## Responsive rules

- Prefer **CSS** (Tailwind responsive variants on the element itself: `hidden lg:block`, `lg:hidden`) for responsive visibility — no wrapper component.
- **Profile** default shell uses three columns at `lg+`; **about** uses two (main + right); **map** and **waiv-table** use a single column.
- **Profile rails** (`PROFILE_RAIL_STICKY_CLASS`) are sticky below the header, cap height to `100dvh` minus header, scroll **vertically** only (`overflow-x-hidden`). Do not omit the X clip — Windows classic scrollbars plus `overflow-y-auto` otherwise paint a horizontal bar that Chrome device mode (overlay scrollbars) does not show.
- **Layout tokens** (`--shell-header-height`, `--shell-left-width`, `--shell-right-width`, `--shell-bottom-height`) are defined per theme in `theme.css` and mapped in `tailwind.config.js` — see [theme.md](theme.md).
- **Horizontal tab menus** (profile primary/sub nav, object section tabs, hub `AppSectionNav`) use shared classes from `horizontal-tab-nav-classes.ts`: single row (`flex-nowrap`), `overflow-x-auto`, optional gutter/card bleed. Tab links use `shrink-0 whitespace-nowrap` via `profileSectionTabClass`. Scrollbar hidden on touch (`scrollbar-hide`).

## Adding a new shell or arrangement

1. **Shell** — add a small presentational component under `shared/presentation/layout/shells/`, export from `layout/index.ts`, attach a route group `layout.tsx` if it maps to a URL family.
2. **Arrangement** — add under `arrangements/`, export from the barrel, document in this file.
3. **Tokens** — if new structural sizes are needed, add CSS variables to **every** `[data-theme='…']` block in `theme.css` and extend Tailwind in the same change; update [theme.md](theme.md).

## Tests

Co-located `*.spec.ts` files cover `gridClassForSlots` (`app-shell`), `ShellInset`, `ShellFullBleedBand`, `buildCardGridClassName` (see `card-grid-classname.ts`), `resolveShellMode`, and `shell-mode-features`. `apps/web/jest.config.cts` extends the Nx preset with a `ts-jest` transform that includes `.tsx` so layout components can be imported in tests.

## Imports

Consume layout from `@/shared/presentation` or `@/shared/presentation/layout` only — **no** deep imports into feature modules for layout primitives.
