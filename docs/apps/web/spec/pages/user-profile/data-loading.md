---
id: web-pages-user-profile-data-loading
title: User profile — data loading
description: This document covers loading **shell profile** data (hero / header counts and display fields). Feed tabs and post lists are out of scope here — see routes/feed.md.
type: spec
status: active
scope: web
tags: [web, page, user-profile, data-loading]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/web/spec/pages/index.md
---

# User profile — data loading

**Back:** [profile-shell.md](profile-shell.md) · [web overview](../../overview.md)

## Scope

This document covers loading **shell profile** data (hero / header counts and display fields). Feed tabs and post lists are out of scope here — see [routes/feed.md](routes/feed.md). The **activity** tab uses Hive account history via [`routes/activity.md`](routes/activity.md), not the blog `Story` feed.

## When data loads

| Location | When |
|----------|------|
| `apps/web/src/app/(app)/user-profile/[name]/layout.tsx` | Validates `name` regex; `await getUserProfileQuery(decoded)` — `notFound()` if null |
| `apps/web/src/app/(app)/user-profile/[name]/(profile)/layout.tsx` | Re-fetches profile with viewer + locale; loads following-objects count head for hero badges |

## Upstream API

| Env | Role |
|-----|------|
| `QUERY_API_URL` | Validated in `apps/web/src/config/env.ts` (single source of truth for server env). Base URL for **query-api** (no `NEXT_PUBLIC_`). Default: `http://localhost:7000`. |

HTTP call (via `queryApiFetch` in `apps/web/src/modules/user-profile/infrastructure/clients/query-api.client.ts`, which reads `env.QUERY_API_URL`):

`GET {QUERY_API_URL}/query/v1/users/{name}/profile`

- Uses Next.js extended `fetch` with default `next: { revalidate: 60 }` (seconds).
- Response `404` → `null` (user missing).
- Other non-OK statuses throw (surfaced as render error unless handled).

## `server-only` client and env

`apps/web/src/config/env.ts` imports `server-only` and exposes typed `env`. `query-api.client.ts` also imports `server-only` and uses `env.QUERY_API_URL`, so profile fetching stays on the server and cannot be bundled into client components.

## Mapping

| query-api `UserProfileView` | `UserProfileShellUser` (shell props) |
|------------------------------|--------------------------------------|
| `name` | `name`, `id` (= `name`) |
| `displayName` | `displayName` |
| `bio` | `bio` |
| `avatarUrl` | `avatarUrl` |
| `coverImageUrl` | `coverImageUrl` |
| `followerCount` | `followerCount` |
| `followingCount` | `followingCount` |
| `postingCount` | `postingCount` |
| `reputation` | *(not shown in shell yet)* |

Validation: Zod `userProfileViewSchema` in `apps/web/src/modules/user-profile/application/dto/user-profile.dto.ts` (used by the HTTP repository).

## Backend contract

See [query-api user profile spec](../../../../query-api/spec/users-profile-endpoint.md).
