---
id: docs-skills-build-tenant-site
title: Build project (tenant site) on ODL
description: Create a new web project — fork apps/web (Next.js), connect to shared query-api. Never deliver a standalone .html prototype. Object-menu or custom routes inside apps/web only.
type: skill
status: active
scope: platform
tags: [agent, web, query-api, tenant, create-project, site-builder, object-menu, custom-ui, fork]
updated_at: 2026-06-30
related:
  - docs/skills/setup-workspace.md
  - docs/skills/query-api-mcp-routing.md
  - docs/skills/knowledge-api-routing.md
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/pages/index.md
  - docs/apps/web/spec/architecture.md
  - apps/web/AGENTS.md
  - docs/apps/query-api/spec/objects-resolve-nested.md
  - docs/apps/web/spec/pages/object/navigation.md
  - docs/apps/web/spec/web-conventions.md
---

# Build project (tenant site) on ODL

**Use this skill when the user wants to create a project** — e.g. “let’s build a site”, “create a project”, “fork and customize the frontend”. Fork the monorepo, customize **`apps/web`**, and connect to a **shared query-api** deployment.

**Two equally valid paths** (pick from user intent; do not assume object-menu only):

| Path | Summary |
|------|---------|
| **Object-menu** | Existing root object defines nav and pages — reuse `/object/…` and `resolve-nested`. Fast when content already lives on chain. |
| **Custom / detailed** | User describes pages, layout, and features — new routes and modules; query-api feeds data where needed. |

Content can live in ODL objects on chain; the web app projects them via HTTP. You may combine paths (e.g. custom marketing home + object-menu catalog).

**Before changing `apps/web`:** read [apps/web/AGENTS.md](../../apps/web/AGENTS.md) (web-specific rules: tokens, modals, i18n, `ObjectCard`, env). Repo-wide rules: [AGENTS.md](../../AGENTS.md).

**Web specs** live under [`docs/apps/web/spec/`](../apps/web/spec/overview.md) — start at [overview](../apps/web/spec/overview.md) and the [site map (pages/index)](../apps/web/spec/pages/index.md) for route-level specs; do not guess URL or data-loading behavior.

**Out of scope for this skill:** full infrastructure clone (chain-indexer, Postgres, Redis), thin starter repo extraction, platform env hooks (`SITE_ROOT_OBJECT_ID`) — document manual steps below until those exist.

## Deliverable (mandatory — read before coding)

The user asked for a **project**, not a mockup. The only acceptable output is a **forked monorepo** with real changes under **`apps/web/`** that run via:

```bash
pnpm install
pnpm nx dev web
```

| Required | Forbidden |
|----------|-----------|
| Git fork (or existing fork) with commits on a branch | Single `.html` / `.htm` file, CodePen, or “paste this in browser” artifact |
| Next.js App Router routes under `apps/web/src/app/` | Vanilla HTML/CSS/JS app outside the monorepo |
| Server-side query-api fetch (`queryApiFetch`, `fetch-*-*.server.ts`) | `fetch('https://…/query/v1/…')` from client `<script>` or Client Components |
| Live projection on each request (SSR/RSC) or agreed client refetch via existing patterns | Hardcoding entire `CATEGORIES` / `CHECKLIST` arrays copied once from MCP into source |
| `pnpm typecheck:web` passes on changed code | “Prototype first, fork later” without explicit user opt-in |
| i18n keys in `src/i18n/locales/*.json` for user-visible copy (unless content is 100% from `pageContent`) | Inline marketing copy only in a throwaway file |

**If you cannot write to a repo** (read-only sidecar): stop and follow [Setup agent workspace](setup-workspace.md) to get a clone with push access — do **not** substitute a standalone HTML file.

### Anti-pattern — “pretty HTML with API sprinkled in”

Agents often build a self-contained `Something.html` with embedded CSS, hero, tabs, and a `<script>` that calls query-api once for modals while **snapshotting** menu/catalog data into `const CATEGORIES = [...]`. That is **not** this skill.

| Wrong (reject) | Right |
|--------------|-------|
| One file dropped in Downloads / chat | `apps/web/src/app/(app)/…` routes + `src/modules/<tenant>/` |
| Browser `fetch` to `QUERY_API_URL` | Server Components / `infrastructure/clients/` calling query-api |
| Shop grid from pasted MCP JSON | `resolve-nested` or `resolve` in server fetcher; map to `ObjectCard` or tenant components |
| Footer links to `#` Map / About | Real routes or omit until implemented |
| “Powered by ODL” static microsite | Branded Next app using `theme.css`, layout shell, env from `.env` |

**Custom multi-section sites** (e.g. landing + gear shop + packing checklist): still **Phase 2b** — one route or section per feature, each backed by named object ids and server fetchers; shared layout in `(app)/layout.tsx`. Prototype data shapes with MCP in Phase 0, then implement in TypeScript modules.

## When to use

- User asks to **create / build a project**, **new site**, or **tenant frontend** on **shared query-api**.
- Fork **`apps/web`**, wire env, ship a branded experience — with or without a root object.
- **Object-menu path:** a root object id exists and nav should mirror its menu (`listItem` tree).
- **Custom path:** user gives detailed UI/UX requirements (landing, map, shop-like sections, etc.) — implement in `apps/web` per specs.
- You need a **client-owned fork** with commits and deploy — not a throwaway clone.
- Variant 1 only: query-api (+ optional auth-api); indexer and DB run elsewhere.

## When not to use

- **Quick visual mockup only** — user wants a Figma-like HTML demo with no repo; say so explicitly and do not use this skill (this skill always means `apps/web` fork).
- **Full stack locally** — [Getting started](../getting-started.md) (Docker, migrations, all apps).
- **Sidecar agent without checkout** — [Setup agent workspace](setup-workspace.md) first (clone path contract only).
- **Read-only spec exploration** — knowledge-api `get_file` / `search_knowledge`; no fork required.
- **On-chain writes** (create objects, updates) — [Hive blockchain broadcast](hive-blockchain-broadcast.md).
- **Custom backend** or replacing query-api — different architecture; not covered here.

## Prerequisites

| Item | Object-menu path | Custom path |
|------|------------------|-------------|
| query-api base URL | required | required |
| GitHub fork | required | required |
| Root object id | required | optional (per-page object ids as needed) |
| User requirements / sitemap | helpful | **required** — capture before coding |
| auth-api URL | optional | optional |
| Hive account + keys | optional | optional |
| IPFS content base | recommended | recommended when showing CID images |

Confirm objects with `check_object_exists` / query-api MCP when ids are used.

## Repo model (fork, not ephemeral clone)

| Do | Don't |
|----|-------|
| **Fork** [open-data-layer](https://github.com/Waiviogit/open-data-layer) on GitHub; clone the fork | Commit secrets or `.env` |
| Work primarily under `apps/web/` (+ i18n, theme, env examples) | Change chain-indexer / query-api for a read-only tenant |
| Branch from upstream **`development`** unless deploy policy says otherwise | Fork only to read code without pushing — use [setup-workspace](setup-workspace.md) |
| Commit incrementally with clear messages | Duplicate resolve/projection logic in the client — use query-api |

```bash
# On GitHub: fork Waiviogit/open-data-layer → your-org/open-data-layer
git clone https://github.com/<your-org>/open-data-layer.git
cd open-data-layer
git remote add upstream https://github.com/Waiviogit/open-data-layer.git
git checkout development
git pull upstream development
pnpm install
```

Sync upstream periodically: `git fetch upstream && git merge upstream/development`.

## Mode decision

| Mode | Choose when | Reuse from platform |
|------|-------------|---------------------|
| **Object-menu** | Content and nav already in one root object; site should mirror its menu | `/object/[object-id]`, nested `?path=`, `resolve-nested`, object page shell |
| **Custom / detailed** | User specifies layouts, routes, components, or flows step by step | New `src/app/` routes + `src/modules/<tenant>/` per [web architecture](../apps/web/spec/architecture.md) |
| **Hybrid** | Custom landing or chrome + object-driven sections | Custom routes for marketing; link into `/object/…` for catalog areas |

Ask the user (or infer from task):

1. **Path:** object-menu, custom, or hybrid — object-menu is **not** the default; match what they asked for.
2. Root object id (object-menu / hybrid only).
3. Minimal (public read-only) vs full shell (profile, wallet, editor).
4. For custom: list routes, data sources (which objects/endpoints), and must-have UI before implementation.

---

## Phase 0 — Discover (before coding)

### Live data (query-api MCP or HTTP)

Connect per [Query API MCP routing](query-api-mcp-routing.md).

**Object-menu / hybrid (root object):**

1. **`resolve_object`** on root id — object type, fields, default landing.
2. **`resolve_nested_objects`** with `{ "ids": ["<root-id>"] }` — menu `listItem` entries, names, ref targets.
3. Optionally **`resolve_nested_objects`** on child ids — catalog depth.
4. **`get_object_type`** — supported updates for types in the tree.

**Custom / detailed:**

1. Map each page/section to query-api calls (`resolve_object`, `discover_objects`, `get_user_shop_objects`, etc.) — see [query-api MCP routing](query-api-mcp-routing.md).
2. **`get_object_type`** / **`get_update_schema`** for any object types the UI will create or display.
3. Prototype with MCP tools before writing React — confirm field shapes match the design.

### Specs (knowledge-api)

Open the **web spec hub** first: [web overview](../apps/web/spec/overview.md) → [pages site map](../apps/web/spec/pages/index.md). Use `list_files({ scope: "web" })` or `resolve_doc({ topic, scope: "web" })` when unsure which feature file applies.

| Topic | Path |
|-------|------|
| Web spec index | [overview.md](../apps/web/spec/overview.md) |
| All routes / page areas | [pages/index.md](../apps/web/spec/pages/index.md) |
| Layering, modules | [architecture.md](../apps/web/spec/architecture.md) |
| Coding rules (web) | [web-conventions.md](../apps/web/spec/web-conventions.md) |
| Agent rules (web code) | [apps/web/AGENTS.md](../../apps/web/AGENTS.md) |
| Object page navigation | [pages/object/navigation.md](../apps/web/spec/pages/object/navigation.md) |
| Object data loading | [pages/object/data-loading.md](../apps/web/spec/pages/object/data-loading.md) |
| resolve-nested API | [objects-resolve-nested.md](../apps/query-api/spec/objects-resolve-nested.md) |
| Maps (geo objects) | [maps.md](../apps/web/spec/maps.md) |
| Object cards in lists | [object-card.md](../apps/web/spec/object-card.md) |
| Layout / shell | [layout-system.md](../apps/web/spec/layout-system.md), [shell-mode.md](../apps/web/spec/shell-mode.md) |

---

## Phase 1 — Bootstrap

**Gate:** do not create UI files until the fork is cloned, `pnpm install` succeeds, and you have confirmed `apps/web` paths from [pages/index.md](../apps/web/spec/pages/index.md). Skipping the fork is a skill violation.

### Environment (`apps/web/.env` — gitignored)

Copy from `apps/web/.env.example`. Minimum for read-only tenant:

| Variable | Purpose |
|----------|---------|
| `QUERY_API_URL` | query-api base (server-side only) |
| `ODL_NETWORK` | `mainnet` or `testnet` — match the indexed deployment |
| `IPFS_CONTENT_BASE_URL` | Resolve CID images in projected fields |

For login/wallet:

| Variable | Purpose |
|----------|---------|
| `AUTH_API_BASE_URL` | auth-api for BFF |
| `AUTH_JWT_SECRET` | Same as auth-api; server-only |

Do **not** use `NEXT_PUBLIC_*` for deployment-specific API URLs — pass via layout providers ([web-conventions](../apps/web/spec/web-conventions.md)).

### Dev server

```bash
pnpm nx dev web
# or production check:
pnpm typecheck:web
```

---

## Phase 2a — Object-menu wiring

Goal: site home and navigation follow the root object’s menu (list items → nested object pages).

### 1. Home → root object

[`apps/web/src/app/(app)/page.tsx`](../../apps/web/src/app/(app)/page.tsx) is currently a placeholder. Redirect or rewrite `/` to `/object/<root-object-id>`:

- **Option A:** `redirect()` in `page.tsx` to `/object/${rootId}` (simplest).
- **Option B:** middleware rewrite (if you need clean `/` without exposing object id in URL later).

**Known gap:** no `SITE_ROOT_OBJECT_ID` env yet — use a constant in server code or `.env` read via `src/config/env.ts` until a platform hook is added.

### 2. Reuse object page stack

Do **not** reimplement nested navigation. Use:

- Route: `/object/[object-id]` with `?path=id1,id2` ([navigation spec](../apps/web/spec/pages/object/navigation.md)).
- Server: `resolveNestedObjectPath`, `fetchNestedObjectsBatch` → `POST /query/v1/objects/resolve-nested`.
- Client: existing object page client handlers for menu clicks and breadcrumbs.

### 3. Branding

| Surface | Where |
|---------|--------|
| Site title / metadata | `apps/web/src/app/layout.tsx`, [seo.md](../apps/web/spec/seo.md) |
| Theme tokens | `apps/web/src/styles/theme.css` |
| Copy | `apps/web/src/i18n/locales/*.json` (UTF-8, no BOM) |

### 4. Optional shell trim

For a focused tenant site, hide or de-emphasize global features (discover, editor, object-create) in header/nav — change presentation only; keep modules intact for upstream merges.

### 5. Content rule

In object-menu mode, **page body and menu items live in ODL objects**. Agents edit **routing/branding/layout**, not duplicate long copy in React unless the user explicitly wants static marketing pages.

---

## Phase 2b — Custom / detailed wiring

When the user wants a **specific product UI** (not the stock object page shell):

1. **Capture requirements** — routes, sections, interactions; agree on data sources (object ids, discover, profile, etc.).
2. Add routes under `apps/web/src/app/(app)/`.
3. Add `src/modules/<tenant>/` per [architecture.md](../apps/web/spec/architecture.md) (domain / application / infrastructure / presentation).
4. Fetch via query-api clients (patterns: `fetch-object-resolve.server.ts`, `fetch-nested-objects.server.ts`, discover/shop clients).
5. Use **`ObjectCard`** for list previews — do not fork card markup ([object-card.md](../apps/web/spec/object-card.md)).
6. Maps: `@/modules/map` only — no direct Leaflet imports ([maps.md](../apps/web/spec/maps.md)).
7. Branding: `layout.tsx`, `theme.css`, i18n — same as object-menu path.

Still use query-api for projection; do not embed SQL or indexer logic in web.

---

## API mapping (update types → UI)

| Update type | Typical UI role | Endpoint |
|-------------|-----------------|----------|
| `listItem` | Nav / catalog rows (`object_ref` to children) | `resolve-nested` (default types include `listItem`) |
| `pageContent` | Main body (Lexical/HTML) | `resolve` or `resolve-nested` |
| `name` | Titles, breadcrumbs | both |
| `image` | Thumbnails, hero | `resolve`; refs expanded in nested |
| `sortCustom` | Menu ordering | `resolve-nested` defaults |
| `geo`, `address` | Map markers | `resolve` with `update_types` |
| `description` | Cards, excerpts | `resolve` |

**`resolve-nested` vs `resolve`:**

| | `POST /objects/resolve-nested` | `POST /objects/resolve` |
|--|-------------------------------|-------------------------|
| Response | Lightweight `{ object_id, object_type, fields }` | Full `ProjectedObject` + counts |
| `update_types` empty | Endpoint defaults (`listItem`, `sortCustom`, `pageContent`, `name`) | All types on object |
| Use for | Menu batches, path stack | Single page hero, SEO, ratings |

Ref targets inside `listItem` are expanded with an internal ref-summary set — not controlled by `update_types` on resolve-nested ([objects-resolve-nested.md](../apps/query-api/spec/objects-resolve-nested.md)).

---

## Auth scope

| Scope | Includes | Skip when |
|-------|----------|-----------|
| **Minimal** | Public object pages, query-api reads | No login, no wallet |
| **Full shell** | Profile `/@name`, wallet, notifications, editor | User needs Waivio-parity account features |

Minimal sites still need `QUERY_API_URL` + IPFS base. Full shell needs auth-api BFF ([auth.md](../apps/web/spec/auth.md)).

---

## Red lines (mandatory)

Follow [apps/web/AGENTS.md](../../apps/web/AGENTS.md) for all UI work in `apps/web` (design tokens, modals, i18n UTF-8, `ObjectCard`, no ad-hoc `process.env`). Repo-wide policy: [AGENTS.md](../../AGENTS.md).

Summary (non-exhaustive — specs and AGENTS files win on conflict):

- No deep imports across modules — use barrel `index.ts`.
- No `axios`; server HTTP via existing `fetch` / `queryApiFetch` patterns.
- No `process.env` scattered in `modules/` — extend `src/config/env.ts`.
- No `NEXT_PUBLIC_*` for per-deployment API URLs.
- Locale JSON: strict UTF-8 without BOM.
- Run tasks via `pnpm nx`, not raw tooling.
- Do not commit `.env` or secrets.

---

## Verification

### Automated

```bash
pnpm typecheck:web
pnpm nx lint web
pnpm nx test web --testPathPatterns=<affected-module>   # when you add tests
```

### Manual

**All paths:** dev server loads; branding; IPFS images if used; locale SSR ok.

**Object-menu / hybrid:** resolve root + nested menu; `/` → root object; nested `?path=` and back button.

**Custom:** each new route renders agreed data; typecheck passes; no duplicate resolve logic outside infrastructure layer.

### MCP (if available)

- `resolve_object` + `resolve_nested_objects` on root id succeed.
- `list_files({ type: "skill" })` includes this file.

---

## Rollback and upstream

- **Revert** tenant commits on the fork if a phase fails; do not force-push shared branches without user approval.
- **Merge `upstream/development`** when taking platform fixes; resolve conflicts mainly in `apps/web/` files you touched.
- After doc-only upstream changes: `pnpm knowledge:reindex` if using local knowledge-api.

---

## Example walkthrough (object-menu)

Only when the user chose **object-menu** or **hybrid** and provided (or discovered) `<root-object-id>`:

1. Phase 0: `resolve_object` + `resolve_nested_objects` on `<root-object-id>`.
2. Phase 1: fork, `QUERY_API_URL` → shared query-api, `pnpm nx dev web`.
3. Phase 2a: redirect `/` → `/object/<root-object-id>` (or hybrid: custom home linking into object routes).
4. Verify menu depth, images, mobile layout.

## Example walkthrough (custom / detailed)

When the user describes the site explicitly (no single root menu object):

1. Phase 0: list pages → map each to query-api tools; prototype one page via MCP.
2. Phase 1: fork + env + `pnpm nx dev web`.
3. Phase 2b: implement `src/modules/<tenant>/` + routes; wire fetchers; theme + i18n.
4. Verify each route against requirements; `pnpm typecheck:web`.

### Example — branded site with shop + checklist (custom path)

User wants a camping brand: hero landing, category shop, interactive checklist — **not** the stock `/object/[object-id]` shell.

| User-facing area | Route (example) | Data source | Server call |
|------------------|-----------------|-------------|-------------|
| Landing | `/` | Static or minimal resolve for hero object | optional `resolve` for `name` / `image` |
| Gear shop | `/shop` or `/gear` | Shop object + category `listItem` children | `resolve-nested` on shop id; per-category `resolve` or nested batch |
| Checklist | `/checklist` | Page object `pageContent` or structured list | `resolve` with `update_types: ['pageContent']` or parse list items |
| Map (if requested) | `/map` | Geo objects | `@/modules/map` + discover/resolve with `geo` |

Implementation sketch (files must live in the fork):

- `apps/web/src/modules/<tenant>/infrastructure/fetch-shop-categories.server.ts`
- `apps/web/src/modules/<tenant>/infrastructure/fetch-checklist.server.ts`
- `apps/web/src/app/(app)/shop/page.tsx` — Server Component loads categories, renders tenant presentation components
- `apps/web/src/app/(app)/checklist/page.tsx` — checklist UI; client state for checkboxes only, not for catalog data

**Do not** ship the above as one `.html` file with `const CATEGORIES = [...]` — that skips the fork, SSR, i18n, and upstream merge path.

---

## Related

- [Setup agent workspace](setup-workspace.md) — clone / path contract
- [Query API MCP routing](query-api-mcp-routing.md) — live data tools
- [Knowledge API routing](knowledge-api-routing.md) — spec discovery
- [web spec overview](../apps/web/spec/overview.md) — feature index for `apps/web`
- [web pages site map](../apps/web/spec/pages/index.md) — every route area
- [apps/web/AGENTS.md](../../apps/web/AGENTS.md) — mandatory before editing web code
- [Getting started](../getting-started.md) — full local stack (not tenant-only)
