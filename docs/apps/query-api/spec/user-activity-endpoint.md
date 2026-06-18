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
| `filters` | string[] | `[]` | Activity filter keys (`ACTIVITY_FILTER_KEYS`); max 14; OR semantics |

Body is optional (`{}` default) — same preprocess pattern as other feed POST endpoints.

**Cursor vs filters:** `cursor` carries only `operationIndex`. Clients must send the same `filters` array on every request (first page and load more). Changing filters starts a new timeline from `from = -1`.

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
| `chainContext` | `totalVestingShares`, `totalVestingFundSteem` for HP conversion in the web UI (from cached `get_dynamic_global_properties`, Redis TTL 5 min) |

## Filtering

- `effective_comment_vote` operations are **excluded** server-side (legacy behavior).

### Activity filters

When `filters` is empty, no Hive operation bitmask is sent (all operation types except `effective_comment_vote` may appear).

When `filters` is non-empty:

1. **Bitmask** — union of Hive operation indices for all selected keys → `operation_filter_low` / `operation_filter_high` on each `get_account_history` RPC round-trip (`makeOperationBitMask` / `buildActivityFilterMask` in `@opden-data-layer/core/hive-account-history`). Indices **0–63** map to `filter_low`; **64–127** to `filter_high`. Large masks use BigInt internally; values above `Number.MAX_SAFE_INTEGER` are sent as decimal strings in RPC params.
2. **Semantic pass** — after mapping each row, `matchesActivityFilters` applies payload rules (OR across selected keys). Bitmask alone is insufficient for vote weight, transfer direction, follow/unfollow/reblog `custom_json`, and reply-vs-post comments.
3. **Sparse bitmask paging** — when a filtered RPC batch is empty but history may continue, the endpoint steps `from` backward by `requestLimit` until index `0` (virtual/reward ops with gaps in history).

| UI filter | Bitmask ops | Semantic |
|-----------|-------------|----------|
| `upvoted` / `downvoted` / `unvoted` | `vote` | `weight` sign |
| `followed` / `unfollowed` | `custom_json` | follow blog / ignore |
| `reblogged` | `custom_json` | reblog action |
| `replied` | `comment` | exclude top-level posts (`parent_author === ''`) |
| `powered_up` | `transfer_to_vesting`, `transfer_to_vesting_completed` | — |
| `received` / `transfer` | `transfer` | `to` / `from` vs profile account |
| `savings` | savings transfer ops + `interest` (index 55) | — |
| `author_reward` / `curation_reward` / `claim_rewards` | respective reward ops | — |

Active filters may require more Hive round-trips before a full page is filled.

## Paging limits

- **Without filters:** up to **40** Hive round trips per HTTP request (`ACTIVITY_FEED_MAX_HIVE_ROUND_TRIPS`).
- **With filters:** up to **80** round trips (`ACTIVITY_FEED_MAX_HIVE_ROUND_TRIPS_WITH_FILTERS`) — rare ops may sit deep in history.
- **Without filters:** **100** raw rows per trip (`HIVE_HISTORY_DEFAULT_BATCH_SIZE`) — many ops are dropped as `effective_comment_vote`.
- **With filters:** **1000** raw rows per trip when `from` allows it (`HIVE_ACCOUNT_HISTORY_MAX_BATCH_SIZE`). Hive requires `start >= limit - 1`; when paging into low operation indices the endpoint shrinks the RPC limit to `min(batchSize, from + 1)` (legacy `walletHelper` behavior).
- **Assert Exception + `sequence`:** when a filtered page is empty but Hive returns `error.data.stack[0].data.sequence`, the client continues from that operation index (legacy `getProcessHistorySocket` in campaigns `hiveRequests.js`) instead of failing the HTTP request.
- On accounts with dense hidden-op noise, `hasMore` may become `false` before the full chain history is exhausted.

## Errors

- `404` when `accounts_current` has no row for `name`.
- `400` when `cursor` is present but cannot be decoded (invalid base64 or payload), or when `filters` contains unknown keys (Zod enum validation).
- `503` when the Hive node returns no account-history payload on a paging round (RPC failure — not an empty account).

## MCP

Tool: `get_user_activity` — same contract as HTTP.

## Verification

`pnpm nx test query-api --testPathPatterns="user-activity|hive-global-properties"`
