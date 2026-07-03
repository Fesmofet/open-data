---
id: docs-apps-scheduler-spec-post-expertise
title: Post author expertise
description: Apply legacy author expertise at post reward finalize and backfill missed posts.
type: spec
status: active
scope: scheduler
tags: [scheduler, expertise, post-reward]
updated_at: 2026-07-03
related:
  - docs/apps/scheduler/spec/post-rewards.md
  - docs/apps/query-api/spec/user-expertise.md
---

# Post author expertise

After [`post-rewards-finalize`](post-rewards.md) sets `rewards_finalized_at`, scheduler credits **post author** expertise to tagged objects (parity with legacy `authorExpertise` batch task). Field-vote (`APPEND_WOBJ`) expertise is out of scope.

## Jobs

| Job | Schedule (UTC) | Purpose |
|-----|----------------|---------|
| (hook in `post-rewards-finalize`) | `*/15 * * * *` | Apply expertise immediately after successful finalize |
| `post-expertise-backfill` | `*/30 * * * *` | Retry posts with `rewards_finalized_at` set and `expertise_applied_at` NULL |

## Formula

Implemented in `@opden-data-layer/core` (`calculatePostExpertiseUsd`):

- `totalPayoutUsd = min(hiveUsd + waivUsd, max_accepted_payout)` — Hive payout strings + `total_rewards_waiv ×` WAIV daily rate at `last_payout` (fallback: latest daily rate).
- `expertiseBaseUsd = totalPayoutUsd × multiplier` — `0.5` after HF25 (2021-06-30), else `0.75`.
- Per `post_objects` row with `percent > 0`: `delta = round(expertiseBaseUsd × percent / 100, 8)`.

Credit **author** (`posts.author`) at three levels:

| Level | Table | Operation |
|-------|-------|-----------|
| user × object | `user_object_expertise` | upsert `weight += delta` |
| user aggregate | `accounts_current.wobjects_weight` | `+= sum(deltas)` |
| object aggregate | `objects_core.weight` | `+= delta` per object |

## Idempotency

`posts.expertise_applied_at` — `NULL` = not processed; set in the same transaction as increments:

```sql
UPDATE posts SET expertise_applied_at = NOW()
WHERE author = ? AND permlink = ? AND expertise_applied_at IS NULL
RETURNING *;
```

If 0 rows, abort (another worker claimed). Posts with no `post_objects` still get `expertise_applied_at` to avoid reprocessing.

Expertise errors **do not** roll back `rewards_finalized_at`; log and rely on backfill.

## Mongo cutover

Historical data: import `user_expertise` → `user_object_expertise`, seed `expertise_applied_at` on all finalized posts so backfill does not double-count aggregates. See [`scripts/migrate-mongo-to-pg/README.md`](../../../../scripts/migrate-mongo-to-pg/README.md).

## Config

| Variable | Default | Notes |
|----------|---------|-------|
| `POST_EXPERTISE_BACKFILL_BATCH_SIZE` | `100` | Root posts per backfill tick |

WAIV rate lookup reuses Hive Engine daily rates table (same fallback as legacy).

## Verification

```bash
pnpm nx test scheduler
```
