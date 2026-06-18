---
id: query-api-user-activity-endpoint
title: User activity endpoint
description: "Thin proxy over Hive `get_account_history` for the profile activity tab."
type: spec
status: active
scope: query-api
tags: [query-api, users, activity, hive]
updated_at: 2026-06-17
related:
  - docs/apps/query-api/spec/user-comments-feed-endpoint.md
  - docs/apps/web/spec/pages/user-profile/routes/activity.md
---

# User activity endpoint

**HTTP:** `POST /query/v1/users/{name}/activity`

## Purpose

Returns paginated on-chain account history for `/@:name/activity`. The query-api layer normalizes Hive rows and cursors only; message formatting and row UI live in `apps/web`.

## Request body

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `limit` | int 1–500 | 20 | Page size (`ACTIVITY_DISPLAY_PAGE_SIZE`; max `ACTIVITY_MAX_PAGE_SIZE`) |
| `cursor` | string? | — | Opaque base64url JSON `{ operationIndex }`; encodes `oldestOnPage.operationIndex - 1` |

Body is optional (`{}` default) — same preprocess pattern as other feed POST endpoints.

## Ordering

- Hive rows are **oldest-first** (`[0]` = oldest, last row = newest, e.g. `58167`).
- The endpoint pools visible ops from each batch, sorts by `operationIndex` descending, and returns the newest page.
- Next Hive `from` uses `batch[0][0]` (oldest in batch), matching legacy `walletHelper.getWalletData`.

## Response

| Field | Description |
|-------|-------------|
| `items[]` | Raw operations: `id`, `operationIndex`, `trxId`, `timestamp` (ISO), `block`, `type`, `payload` |
| `cursor` | Next page cursor or `null` |
| `hasMore` | Whether more history exists |
| `chainContext` | `totalVestingShares`, `totalVestingFundSteem` for HP conversion in the web UI |

## Filtering

- `effective_comment_vote` operations are **excluded** server-side (legacy behavior).

## Paging limits

- Each HTTP request may perform up to **40** Hive round trips (`ACTIVITY_FEED_MAX_HIVE_ROUND_TRIPS`), fetching **100** raw rows per trip (`HIVE_HISTORY_REQUEST_SIZE`).
- On accounts with dense hidden-op noise, `hasMore` may become `false` before the full chain history is exhausted.

## Errors

- `404` when `accounts_current` has no row for `name`.
- `400` when `cursor` is present but cannot be decoded (invalid base64 or payload).
- `503` when the Hive node returns no account-history payload on a paging round (RPC failure — not an empty account).

## MCP

Tool: `get_user_activity` — same contract as HTTP.

## Verification

`pnpm nx test query-api --testPathPattern=user-activity`
