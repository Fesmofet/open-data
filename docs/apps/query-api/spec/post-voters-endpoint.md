# Post voters endpoint

`GET /query/v1/posts/:author/:permlink/voters`

On-demand paginated voter list for the feed reactions modal. Feed payloads are unchanged; this endpoint is called only when the user opens the modal.

## Query

| Param | Required | Description |
|-------|----------|-------------|
| `direction` | yes | `up` or `down` |
| `contentType` | no | `post` (default) or `thread` (`thread_active_votes`) |
| `limit` | no | Page size, default **20**, max **20** |
| `cursor` | no | Opaque value from prior `nextCursor` |
| `currency` | no | Fiat for `valueLabel` (default `USD`) |

## Response

| Field | Type | Description |
|-------|------|-------------|
| `upvoteCount` | number | Total upvotes (for tab badge) |
| `downvoteCount` | number | Total downvotes |
| `items` | array | Voter rows for this page |
| `nextCursor` | string \| null | Present when more pages exist |

Each item: `voter`, `percent` (display scale 0–100), `valueUsd`, `valueLabel`, `profile` (`name`, `displayName`, `avatarUrl`).

## Data source

1. **Post:** `post_active_votes` when rows exist; else Hive `get_active_votes` + post/content payout fields for USD.
2. **Thread:** `thread_active_votes` + `threads` payout fields.

USD per voter uses legacy `postPayoutCalculate` (proportional Hive `rshares` + WAIV `rshares_waiv`). WAIV pool tokens: `total_rewards_waiv` when set, else `total_payout_waiv` (same as post reward). WAIV denominator: `SUM(rshares_waiv)` from active votes when present, else `posts.net_rshares_waiv`.

Rows are sorted by computed fiat `valueUsd` descending (then `voter` ascending). Cursor `sortKey` is fixed-precision USD for pagination.

## Errors

| Status | When |
|--------|------|
| 404 | Unknown post/thread or no voter data on Hive fallback |

## Verification

```bash
pnpm nx test query-api --testPathPattern=get-post-voters
```
