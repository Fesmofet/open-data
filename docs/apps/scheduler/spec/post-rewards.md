---
id: docs-apps-scheduler-spec-post-rewards
title: Post rewards jobs
description: Hourly WAIV reconcile and post-cashout reward finalization drained from chain-indexer Redis queues.
type: spec
status: active
scope: scheduler
tags: [scheduler, waiv, post-reward]
updated_at: 2026-06-12
related:
  - docs/apps/chain-indexer/spec/waiv-post-reward.md
---

# Post rewards jobs

chain-indexer writes realtime WAIV votes/rewards and enqueues work; **scheduler** drains two Redis ZSETs on the shared ODL Postgres `posts` table.

## Jobs

| Job | Schedule (UTC) | Queue key |
|-----|----------------|-----------|
| `waiv-post-reconcile` | `15 * * * *` (hourly) | `chain-indexer:queue:post-waiv-reconcile` |
| `post-rewards-finalize` | `*/15 * * * *` | `chain-indexer:queue:post-rewards-finalize` |

## `waiv-post-reconcile`

- Claims most recently dirtied root posts first (persistent ZSET; failed entries re-touched).
- Skips posts with `rewards_finalized_at` set.
- Refreshes Hive payout columns via `getContent`.
- For WAIV-eligible tags: syncs HE `comments/posts` + `comments/votes` into `net_rshares_waiv`, `total_payout_waiv`, `post_active_votes.rshares_waiv`.

## `post-rewards-finalize`

Runs once per post after cashout (+ `POST_REWARDS_FINALIZE_DELAY_SEC`, default 900s):

1. Claims due members from finalize ZSET + PG safety net (`rewards_finalized_at IS NULL`, `cashout_time` past delay).
2. `getContent` → Hive payout columns.
3. WAIV-eligible: history `comments_authorReward` + `comments_beneficiaryReward` (sum × 2, legacy); `total_rewards_waiv = max(realtime, history)`. Curation stays in realtime HE only.
4. Sets `rewards_finalized_at`; removes ZSET member.
5. **`PostExpertiseService.applyForPost`** — author expertise to `user_object_expertise` + weight aggregates; sets `expertise_applied_at`. See [`post-expertise.md`](post-expertise.md).

Realtime HE reward events remain in chain-indexer; finalize is authoritative closure.

## Config

Scheduler env (`apps/scheduler/.env.example`; Docker stack uses root `.env`):

| Variable | Default | Notes |
|----------|---------|-------|
| `HIVE_ENGINE_HISTORY_NODES` | `accounts.hive-engine.com`, `history.hive-engine.com`, `v6-he.atexoras.com:8443` | Comma-separated History API origins for finalize |
| `POST_REWARDS_FINALIZE_DELAY_SEC` | `900` | Must match **chain-indexer** (ZSET score + PG safety net) |
| `POST_REWARDS_FINALIZE_BATCH_SIZE` | `50` | Max posts per finalize tick |
| `POST_REWARD_RECONCILE_BATCH_SIZE` | `1000` | Max dirty reconcile entries per hourly tick (~posts/hour) |
| `HIVE_ENGINE_NODES` | lib defaults | JSON-RPC for reconcile HE sync |

Deploy: run migration `00021_posts_rewards_finalized_at` before enabling jobs; both **chain-indexer** and **scheduler** must run against the same Postgres + Redis.

## Verification

```bash
pnpm nx test scheduler
```
