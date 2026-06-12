---
id: docs-apps-chain-indexer-spec-waiv-post-reward
title: WAIV post rewards
description: Indexes WAIV reward fields on root posts from Hive Engine comments contract; scheduler reconcile and finalize.
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, waiv, post-reward]
updated_at: 2026-06-12
related:
  - docs/apps/chain-indexer/spec/overview.md
  - docs/apps/query-api/spec/post-reward.md
  - docs/apps/scheduler/spec/post-rewards.md
  - docs/spec/waiv-power.md
---

# WAIV post rewards

Persists WAIV payout fields on **root posts** (`depth = 0`) for feed reward display in query-api.

## Fields (`posts`)

| Column | Phase | Meaning |
|--------|-------|---------|
| `net_rshares_waiv` | Potential | Sum of WAIV vote rshares before cashout |
| `total_payout_waiv` | Potential | `net_rshares_waiv × (rewardPool / pendingClaims)` |
| `total_rewards_waiv` | Paid | Actual WAIV paid (realtime HE + finalize merge) |
| `rewards_finalized_at` | Paid | Set once post-cashout finalize completes; historical mongo import derives from past `cashout_time` |
| `post_active_votes.rshares_waiv` | Both | Per-voter WAIV rshares |

## Eligibility

Root post `json_metadata.tags` must intersect `WAIV_REWARD_ELIGIBLE_TAGS` in `@opden-data-layer/core` for **potential** WAIV updates. Reward events at cashout apply regardless.

## Pipeline

1. **Realtime (chain-indexer)** — `WaivPostRewardParser` (Hive Engine blocks, `comments` contract): `newVote` / `updateVote` → potential fields; `authorReward` / `curationReward` / `beneficiaryReward` → `total_rewards_waiv` (skipped after `rewards_finalized_at`).
2. **Reconcile (scheduler)** — job `waiv-post-reconcile`: drains Redis dirty queue; refreshes Hive payout + HE votes/posts for eligible roots. See [`post-rewards.md`](../../scheduler/spec/post-rewards.md).
3. **Finalize (scheduler)** — job `post-rewards-finalize`: after `cashout_time + POST_REWARDS_FINALIZE_DELAY_SEC`, `getContent` + WAIV history fallback (author+beneficiary × 2, legacy); curation only from realtime HE. Sets `rewards_finalized_at`.

**Enqueue (chain-indexer):** root post upsert schedules `chain-indexer:queue:post-rewards-finalize` (ZADD score = cashout unix + delay). Dirty reconcile via `chain-indexer:queue:post-waiv-reconcile` on votes / missing post.

Pool rate cache: Redis `chain-indexer:cache:waiv-reward-pool` (60s TTL), source `comments/rewardPools` id `13`.

Reconcile dirty queue: **persistent** (no TTL). Members removed after successful reconcile. Failed entries re-touched.

Reward event dedup: Redis `chain-indexer:cache:waiv-reward-event:{txId}:{event}:{authorperm}` with 7-day TTL (`SET NX`).

## Out of scope (v1)

- Campaign sponsors / match-bot sponsor obligations
- Optimistic API like updates (`likePost.js`, `PROCESSED_LIKES*`)
- Comments (`depth > 0`), expertise distribution, non-WAIV tokens

## Query layer

query-api reads these columns via [`post-reward.md`](../../query-api/spec/post-reward.md); no client-side payout math.

## Verification

```bash
pnpm nx test chain-indexer
pnpm nx test core
pnpm nx test scheduler
```
