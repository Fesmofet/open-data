---
id: docs-skills-build-tenant-site
title: Build project (tenant site) on ODL
description: Build a user's web project on ODL. Default path — start from the waivio-pages-starter repo (static Next.js, GitHub Pages, Keychain, query-api client); agent uses its own GitHub account to fork, iterate, and deploy, sharing the Pages URL. Fallback path (server required) — fork apps/web from the open-data-layer monorepo.
type: skill
status: active
scope: platform
tags: [agent, web, query-api, tenant, create-project, site-builder, starter, github-pages, static-export, keychain, fork]
updated_at: 2026-07-01
related:
  - docs/skills/setup-workspace.md
  - docs/skills/query-api-mcp-routing.md
  - docs/skills/knowledge-api-routing.md
  - docs/skills/hive-account-signup.md
  - docs/skills/hive-blockchain-broadcast.md
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/pages/index.md
  - docs/apps/web/spec/architecture.md
  - apps/web/AGENTS.md
  - docs/apps/query-api/spec/objects-resolve-nested.md
---

# Build project (tenant site) on ODL

**Use this skill when the user wants to build a web project** on the Open Data Layer — e.g. "let's build a site", "create a project", "make me an app on your data".

There are **two paths**. Pick based on whether the project needs a server. **Default to Path A.**

| Path | Start from | Runtime | When |
|------|-----------|---------|------|
| **A — Starter (DEFAULT)** | [`Waiviogit/waivio-pages-starter`](https://github.com/Waiviogit/waivio-pages-starter) | Static files on **GitHub Pages** (no server) | Almost always. Clean repo purpose-built for agentic development: static Next.js export, typed query-api client, Hive Keychain connect + broadcast, no auth-api. |
| **B — Full web fork (server required)** | [`Waiviogit/open-data-layer`](https://github.com/Waiviogit/open-data-layer) `apps/web` | Node server (SSR, BFF, auth-api) — **needs hosting** | Only when the user explicitly wants full Waivio parity (server-side rendering, cookie/JWT auth, editor, notifications WS). Tell the user it needs a server host first (propose options), then fork. |

> The current emphasis is **Path A**. The starter is literally a clean project already adapted for agent-driven work. Do not reach for the monorepo fork unless the user's requirements cannot be met by a static site.

---

## Path A — waivio-pages-starter (default)

### What the agent needs

The agent operates its **own GitHub account** and a **Personal Access Token (key)** to perform all repository operations on that account: create/fork the repo, push commits, configure repository **settings**, enable **Pages**, and set repo **variables**.

| Requirement | Purpose |
|-------------|---------|
| **GitHub account (agent-owned)** | Owns the project repo used to iterate and publish |
| **GitHub PAT / token** (repo + pages/admin scope) | Create repo, push, set repo variables, enable GitHub Pages via API/CLI |
| **query-api base URL** | Data source; the site calls `{QUERY_API_URL}/query/v1/...` from the browser |
| **Hive Keychain** (end user's browser) | Signing/broadcast happens client-side; the agent does not hold user keys |
| Hive account + key (agent, optional) | Only if the agent must seed on-chain ODL content during setup — see [Hive broadcast](hive-blockchain-broadcast.md) |

The site itself has **no backend**: reads go straight to query-api from the browser; writes go through the user's Keychain extension. No secrets are baked into the static build (config is `NEXT_PUBLIC_*` at build time).

### Constraints (from the starter, do not violate)

Read [`waivio-pages-starter/AGENTS.md`](https://github.com/Waiviogit/waivio-pages-starter/blob/main/AGENTS.md) and [`README.md`](https://github.com/Waiviogit/waivio-pages-starter/blob/main/README.md) before coding. Because it is a static export (`output: 'export'`), the following are **forbidden**:

- Server Actions (`'use server'`), `src/app/api/**` route handlers, `middleware.ts` / `proxy.ts`
- SSR data fetching in Server Components, `next.revalidate` / `revalidateTag` / ISR
- auth-api integration (challenge/verify, JWT cookies), `import 'server-only'`
- BFF proxy pattern (`fetch('/api/...')` → query-api)

Allowed/required: `output: 'export'`, `images: { unoptimized: true }`, `trailingSlash: true`, `basePath` from `NEXT_PUBLIC_BASE_PATH`, `'use client'` routes, all config via `NEXT_PUBLIC_*`.

### Workflow

1. **Get the repo onto the agent's account.**
   - Preferred: create from the starter (fork [`Waiviogit/waivio-pages-starter`](https://github.com/Waiviogit/waivio-pages-starter) or "Use this template") under the agent's account, then clone.
   - Verify push access with the agent's token before writing files.

   ```bash
   # via GitHub CLI (agent account authenticated)
   gh repo fork Waiviogit/waivio-pages-starter --clone --fork-name <user-project>
   cd <user-project>
   pnpm install
   ```

2. **Configure.** Copy `.env.example` → `.env.local`; set `NEXT_PUBLIC_QUERY_API_URL` (shared query-api), `NEXT_PUBLIC_BASE_PATH` (`/<repo>` for project pages, empty for user/org pages), `NEXT_PUBLIC_ODL_NETWORK`, `NEXT_PUBLIC_HIVE_CUSTOM_JSON_ID`.

3. **Discover data (query-api MCP/HTTP).** Prototype the exact reads the UI needs before writing React — see [Query API MCP routing](query-api-mcp-routing.md). Map each page/section to endpoints (`search`, `discover`, `objects/resolve`, `resolve-nested`, `users/:name/profile`, wallet, currency).

4. **Iterate on the project the user wants.** Work inside the starter's module layout:
   - `src/modules/query-api/` — add Zod schemas in `domain/`, query functions in `application/queries/`.
   - `src/modules/wallet/` — reuse Keychain connect + `hive-broadcast` op builders (vote, transfer, ODL `custom_json`).
   - `src/app/` — thin `'use client'` routes; UI in module `presentation/` components.
   - `src/i18n/locales/*.json` — user-visible copy (strict UTF-8, no BOM); `src/styles/theme.css` — branding tokens.
   - Reads via `queryApiFetch` (Zod-validated, `Result<T,E>`); paginated feeds via `useInfiniteScroll`. After broadcast, refetch client-side (no server revalidation).

5. **Verify locally.**

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm build   # must produce out/ with static routes only
   ```

   Confirm no new `'use server'`, `app/api/`, or `middleware` files.

6. **Deploy to GitHub Pages and share the link.**
   - Enable Pages → source **GitHub Actions** (the starter ships `.github/workflows/deploy.yml`).
   - Set repo variables as needed: `QUERY_API_URL`, `ODL_NETWORK`, `HIVE_CUSTOM_JSON_ID`.
   - Push to `main`; the workflow builds `out/` and deploys.
   - **Give the user the resulting `https://<account>.github.io/<repo>/` URL as the running example.** Iterate from their feedback and redeploy.

   ```bash
   # enable Pages + set a variable via CLI (agent token)
   gh api -X POST repos/<account>/<repo>/pages -f build_type=workflow
   gh variable set QUERY_API_URL --repo <account>/<repo> --body "https://<query-api-host>"
   git push origin main
   ```

7. **query-api CORS.** Browser calls need query-api to allow `Accept-Language`, `X-Locale`, `Authorization`, `X-Governance-Object-Id`, and **`X-Viewer`** (personalized reads). The [open-data-layer](https://github.com/Waiviogit/open-data-layer) query-api already includes these; if the user runs their own, tell them to add `X-Viewer`.

### Deliverable (Path A)

A repo on the agent's (or user's) GitHub account, deployed to GitHub Pages, that the user can fork/own. Not a single `.html` file, not a "paste in browser" artifact. The Pages URL is the shareable example.

---

## Path B — Full web fork (only when a server is required)

Use **only** when the user explicitly needs features a static site cannot provide: server-side rendering, cookie/JWT session auth (auth-api), the editor, notifications WebSocket, or runtime revalidation.

**First, be explicit with the user:** this variant **needs a server to host** (it is not deployable to GitHub Pages). Propose hosting options (e.g. a VPS/Docker host, a Node-capable PaaS, or the platform's own deployment) and confirm before forking.

Then fork the monorepo and work in `apps/web`:

```bash
# On GitHub: fork Waiviogit/open-data-layer → <account>/open-data-layer
git clone https://github.com/<account>/open-data-layer.git
cd open-data-layer
git remote add upstream https://github.com/Waiviogit/open-data-layer.git
git checkout development && git pull upstream development
pnpm install
pnpm nx dev web
```

- **Before editing web code:** read [apps/web/AGENTS.md](../../apps/web/AGENTS.md) (tokens, modals, i18n UTF-8, `ObjectCard`, env-via-providers) and the web spec hub: [overview](../apps/web/spec/overview.md) → [pages site map](../apps/web/spec/pages/index.md) → [architecture](../apps/web/spec/architecture.md).
- **Two sub-modes** (as before):
  - **Object-menu** — a root object defines nav; reuse `/object/[object-id]`, `?path=`, `resolve-nested`, and the object page shell. Redirect `/` → `/object/<root-id>`.
  - **Custom / detailed** — user-specified routes and modules under `src/modules/<tenant>/`; server fetchers (`*.server.ts` / `queryApiFetch`) call query-api; use `ObjectCard` for list previews and `@/modules/map` for geo.
- **Env** (`apps/web/.env`, gitignored): `QUERY_API_URL`, `ODL_NETWORK`, `IPFS_CONTENT_BASE_URL`; add `AUTH_API_BASE_URL` + `AUTH_JWT_SECRET` for login/wallet. Do not use `NEXT_PUBLIC_*` for per-deploy URLs — pass via layout providers.
- **Verify:** `pnpm typecheck:web`, `pnpm nx lint web`.
- **Scope:** Variant 1 only — query-api (+ optional auth-api) is shared; chain-indexer, Postgres, Redis run elsewhere. Full local stack is out of scope ([getting-started.md](../getting-started.md)).

### API mapping (both paths, update types → UI)

| Update type | Typical UI role | Endpoint |
|-------------|-----------------|----------|
| `listItem` | Nav / catalog rows (`object_ref` to children) | `resolve-nested` (defaults include `listItem`) |
| `pageContent` | Main body (Lexical/HTML) | `resolve` or `resolve-nested` |
| `name` | Titles, breadcrumbs | both |
| `image` | Thumbnails, hero | `resolve`; refs expanded in nested |
| `geo`, `address` | Map markers | `resolve` with `update_types` |
| `description` | Cards, excerpts | `resolve` |

`resolve-nested` returns lightweight `{ object_id, object_type, fields }` for menu batches/path stacks; `resolve` returns the full `ProjectedObject` + counts for a single page ([objects-resolve-nested.md](../apps/query-api/spec/objects-resolve-nested.md)).

---

## When not to use

- **Quick throwaway visual mockup with no repo** — say so explicitly; this skill always produces a real repo (Path A) or fork (Path B).
- **On-chain writes / object creation** — [Hive blockchain broadcast](hive-blockchain-broadcast.md).
- **User needs a Hive account first** — [Hive account signup](hive-account-signup.md).
- **Read-only spec exploration** — knowledge-api (`get_file` / `search_knowledge`); no repo needed.
- **Custom backend replacing query-api** — different architecture, not covered here.

## Choosing the path (decision)

1. Can the requirements be met by browser reads (query-api) + Keychain writes + static pages? → **Path A** (default).
2. Does the user explicitly need SSR, server session auth, editor, or notifications WS? → **Path B**, after agreeing on a server host.
3. Unsure? Start Path A, ship a Pages preview, and escalate to Path B only if a hard server-only requirement appears.

---

## Related

- [waivio-pages-starter](https://github.com/Waiviogit/waivio-pages-starter) — the default starter repo (static, Pages, Keychain, query-api)
- [open-data-layer](https://github.com/Waiviogit/open-data-layer) — backend monorepo + reference `apps/web`
- [Setup agent workspace](setup-workspace.md) — clone / path contract
- [Query API MCP routing](query-api-mcp-routing.md) — live data tools
- [Knowledge API routing](knowledge-api-routing.md) — spec discovery
- [Hive account signup](hive-account-signup.md) / [Hive blockchain broadcast](hive-blockchain-broadcast.md) — accounts and on-chain writes
- [web spec overview](../apps/web/spec/overview.md) · [pages site map](../apps/web/spec/pages/index.md) · [apps/web/AGENTS.md](../../apps/web/AGENTS.md) — Path B references
