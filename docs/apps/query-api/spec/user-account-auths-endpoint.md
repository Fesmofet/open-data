---
id: docs-apps-query-api-spec-user-account-auths-endpoint
title: User Hive account authority lists
description: Reverse lookup for Hive account_auths — who delegated owner/active/posting authority to a user.
type: spec
status: active
scope: query-api
tags: [query-api, hive, authority]
updated_at: 2026-09-07
related:
  - docs/apps/query-api/spec/overview.md
  - docs/apps/chain-indexer/spec/account-authority-grants.md
---

# User Hive account authority lists

Reverse index for Hive `account_auths` edges stored in `user_account_auths`. Replaces the broken `condenser_api.get_account_references` RPC.

## Routes

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/query/v1/users/{name}/authority-grantors` | Accounts that delegated `owner`, `active`, or `posting` authority **to** `{name}`. |
| `GET` | `/query/v1/users/{name}/authority-grantees` | Accounts that received authority **from** `{name}`. |

Public read — no JWT. Profile fields are not joined; callers can fetch `GET .../profile` separately.

## Query parameters

Both routes share:

| Param | Type | Default | Notes |
| ----- | ---- | ------- | ----- |
| `type` | `owner` \| `active` \| `posting` | (all) | Optional filter |
| `skip` | int ≥ 0 | `0` | Pagination offset |
| `limit` | int 0–100 | `20` | Page size |

Default sort: `grantor ASC` (grantors route) / `grantee ASC` (grantees route).

## Response

Grantors example:

```json
{
  "items": [
    { "grantor": "flowmaster", "authorityType": "posting" }
  ],
  "total": 1,
  "hasMore": false
}
```

Grantees use `{ "grantee", "authorityType" }` items with the same pagination envelope.

## Errors

- `404` when `{name}` is not in `accounts_current`.
- `400` on invalid query (e.g. unknown `type`, `limit` > 100).

## MCP

- `get_user_authority_grantors`
- `get_user_authority_grantees`

## Indexer

Live updates: [account-authority-grants](../../chain-indexer/spec/account-authority-grants.md).

Backfill: `pnpm backfill:user-account-auths`.
