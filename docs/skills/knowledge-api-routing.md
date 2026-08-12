---
title: Knowledge API routing for agents
description: First-visit map for MCP tools, doc types, and which skill or spec to open for a task.
type: skill
status: active
scope: platform
tags: [knowledge-api, agent, onboarding, routing, mcp, first-visit]
updated_at: 2026-06-11
related:
  - docs/README.md
  - docs/apps/knowledge-api/spec/overview.md
  - docs/standards/docs-standards.md
  - docs/skills/setup-workspace.md
  - docs/skills/query-api-mcp-routing.md
  - docs/skills/obl-offers-contracts.md
  - docs/skills/obl-ledger.md
  - docs/skills/obl-disputes.md
  - docs/getting-started.md
---

# Knowledge API routing for agents

## When to use

- First connection to **knowledge-api** MCP — you need a map of tools and doc types.
- User task is unclear and you do not know which spec or skill to open.
- You want a catalog of playbooks before searching.

## When not to use

- You already know the exact path (e.g. from user or spec citation) — call `get_file` directly.
- You need **Cursor runtime** skills (Next.js, Nx generators) — those live in `.agents/skills/` and are **not** indexed here.
- You need chain JSON Schema — use `get_object_type` / `get_update_schema`, not search.

## First visit steps

1. Read MCP **server instructions** (returned on `initialize`) or resource `odl-knowledge://routing`.
2. `list_files({ type: "skill" })` — all playbooks with `description` one-liners.
3. `resolve_doc({ topic: "<user task>" })` — best path(s) before opening files.
4. `get_file({ path: "<chosen path>" })` — full markdown before implementing.
5. `get_context({ topic })` — compact chunks when you need excerpts without full files.
6. App features: `resolve_doc({ topic, scope: "<app>" })` or `list_files({ scope: "<app>" })`.

## Decision table

| User intent | Doc type | Open first |
|-------------|----------|------------|
| How to use MCP / where to look | skill | `docs/skills/knowledge-api-routing.md` (this file) |
| Clone repo for sidecar agent | skill | `docs/skills/setup-workspace.md` |
| Local dev: Docker, migrate, serve | overview | `docs/getting-started.md` |
| New Hive account | skill | `docs/skills/hive-account-signup.md` |
| Sign/broadcast Hive/ODL txs | skill | `docs/skills/hive-blockchain-broadcast.md` |
| HAS agent session / local agent-wallet | skill | `docs/skills/hive-has-agent-wallet.md` |
| HAS login from Telegram / chat messengers | skill | `docs/skills/has-login-from-chat.md` |
| OBL: discover/publish/sign offers & contracts | skill | `docs/skills/obl-offers-contracts.md` |
| OBL: invoices, payments, pair balance / ledger | skill | `docs/skills/obl-ledger.md` |
| OBL: disputes & arbitration | skill | `docs/skills/obl-disputes.md` |
| Build a user's web project (default: waivio-pages-starter → GitHub Pages; server variant: fork apps/web) | skill | `docs/skills/build-tenant-site.md` |
| App feature behavior | spec / overview | `docs/apps/<app>/spec/` or `overview.md` |
| Live platform data (objects, feeds, posts, OBL reads) | skill | `docs/skills/query-api-mcp-routing.md` → query-api MCP |
| Domain rules (votes, governance, OBL norms) | spec | `docs/spec/README.md` · `docs/spec/open-business-layer.md` |
| Object/update payload shape | registry tools | `get_object_type` / `get_update_schema` |
| Coding style in this repo | agents | `AGENTS.md` or `apps/<app>/AGENTS.md` |

## MCP tools cheat sheet

| Tool / resource | When |
|-----------------|------|
| `odl-knowledge://routing` | First-visit routing map (resource) |
| `resolve_doc` | Best path(s) for a task — prefer over raw search |
| `get_context` | Compact chunks (router + hybrid search) |
| `list_files` | Browse catalog; `type: skill` on first visit; supports `limit`/`offset` |
| `search_knowledge` | Chunk-level hybrid FTS + trigram discovery |
| `get_file` | Full doc after you have a path |
| `list_tags` | Explore indexed topics |
| `get_object_type` | Object create / type definition |
| `get_update_schema` | Update payload JSON Schema |

## Indexed skills

| Path | Purpose |
|------|---------|
| `docs/skills/knowledge-api-routing.md` | MCP routing map (this file) |
| `docs/skills/setup-workspace.md` | Sidecar agent: clone repo, path contract |
| `docs/skills/hive-account-signup.md` | Create a new Hive account |
| `docs/skills/hive-blockchain-broadcast.md` | Sign and broadcast ODL / Hive ops |
| `docs/skills/hive-has-agent-wallet.md` | Local HAS agent-wallet MCP daemon |
| `docs/skills/has-login-from-chat.md` | HAS login via webLink in Telegram/Slack |
| `docs/skills/query-api-mcp-routing.md` | Live-data query-api MCP tool map |
| `docs/skills/obl-offers-contracts.md` | OBL offers: discover, publish, sign contracts |
| `docs/skills/obl-ledger.md` | OBL invoices, payments, balances, ledger |
| `docs/skills/obl-disputes.md` | OBL disputes and arbitration |
| `docs/skills/build-tenant-site.md` | Build a web project. Default: start from waivio-pages-starter (static Next.js, GitHub Pages, Keychain, query-api client); agent uses its own GitHub account to fork/iterate/deploy. Server variant: fork apps/web from the monorepo. |

## Verification

- `list_files({ type: "skill" })` returns all rows above with non-empty `description`.
- `get_context({ topic: "knowledge api routing" })` includes this file.

## Related

- [Documentation index](../README.md)
- [knowledge-api overview](../apps/knowledge-api/spec/overview.md)
- [Documentation standards](../standards/docs-standards.md)
