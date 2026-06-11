---
id: web-bff-api
title: web — BFF API routes
description: Next.js **Route Handlers** under `apps/web/src/app/api/` proxy to backend services. The browser must not call auth-api or query-api origins directly for these flows.
type: spec
status: active
scope: web
tags: [web, bff, api, cross-cutting]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/auth.md
  - docs/apps/web/spec/search.md
---

# web — BFF API routes

**Back:** [web overview](overview.md) · **Related:** [auth.md](auth.md), [search.md](search.md)

## Purpose

Next.js **Route Handlers** under `apps/web/src/app/api/` proxy to backend services. The browser must not call auth-api or query-api origins directly for these flows.

## Catalog

| Route | Method | Upstream | Used by |
|-------|--------|----------|---------|
| `/api/auth/challenge` | POST | `{AUTH_API_BASE_URL}/auth/v1/challenge` | Login (challenge/response) |
| `/api/auth/verify/[provider]` | POST | `{AUTH_API_BASE_URL}/auth/v1/verify/...` | Provider-specific verify |
| `/api/auth/callback/hivesigner` | GET | HiveSigner OAuth + auth-api token exchange | HiveSigner redirect |
| `/api/auth/refresh` | POST | `{AUTH_API_BASE_URL}/auth/v1/refresh` | Manual refresh; also used from `proxy.ts` |
| `/api/auth/logout` | POST | auth-api logout + clear cookies | Account menu |
| `/api/auth/ws-token` | GET | auth-api WS token | Notifications WebSocket |
| `/api/search` | GET | `{QUERY_API_URL}/query/v1/search` | Header predictive search |
| `/api/search/counts` | GET | query-api search counts | Search UI tallies |
| `/api/search/objects-by-ids` | GET | query-api batch object lookup | Discover / object pickers |
| `/api/discover/objects` | GET | query-api discover objects | [Discover page](pages/discover/page.md) |
| `/api/discover/users` | GET | query-api discover users | Discover page |
| `/api/discover/tag-categories` | GET | query-api tag categories | Discover filters |
| `/api/hello` | GET | — | Health / smoke only |

## Conventions

- Set **httpOnly** cookies on auth routes (`odl_access`, `odl_refresh`). Details: [auth.md](auth.md).
- Search and discover routes forward **viewer** (session) and **locale** where query-api supports it.
- Env: `AUTH_API_BASE_URL`, `QUERY_API_URL`, `AUTH_JWT_SECRET` — see `apps/web/.env.example`.

## Verification

| Check | Command / action |
|-------|------------------|
| Auth challenge | `curl -X POST http://localhost:3000/api/auth/challenge` (with valid body) |
| Search | `GET /api/search?q=alice` while logged in |
