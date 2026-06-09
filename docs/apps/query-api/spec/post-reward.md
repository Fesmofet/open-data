# Post reward (Plan A)

Server-computed post rewards on all post-shaped feed payloads. Clients display `reward.label` and optional WAIV eligibility styling — no client-side payout math.

## Response fields

On `FeedStoryItem` (blog, mentions, comments, threads placeholder, single post, discussion comments):

| Field | Type | Description |
|-------|------|-------------|
| `reward` | `PostReward \| null` | `null` when total payout ≤ 0 (unless payout declined). |
| `waivRewardEligible` | `boolean` | `json_metadata.tags` intersects `WAIV_REWARD_ELIGIBLE_TAGS` in `@opden-data-layer/core`. |

`pendingPayout` / `totalPayout` remain for compatibility (deprecated).

### `PostReward`

| Field | Description |
|-------|-------------|
| `amount`, `currency`, `label` | Badge display (potential → potential total; paid → capped total). |
| `phase` | `potential` or `paid` (after cashout). |
| `breakdown` | WAIV / HIVE / HBD / total money lines; optional author/curator shares when paid. |
| `beneficiaries` | Account, percent; modal includes server-computed `payout.label` per row. |
| `cashoutAt` | ISO timestamp for “will release” tooltip text. |
| `isPayoutDeclined`, `payoutLimitHit` | Legacy parity flags. |
| `promotionCost` | When `promoted` > 0. |
| `rewardPowerOnly` | When `percent_hbd` / `percent_steem_dollars` is 0 (100% HP). |

## Currency parameter

| Endpoint | Parameter | Default |
|----------|-----------|---------|
| `GET /query/v1/posts/:author/:permlink` | query `currency` | `USD` |
| `GET /query/v1/posts/:author/:permlink/discussion` | query `currency` | `USD` |
| `POST /query/v1/users/:name/blog` | body `currency` | `USD` |
| `POST /query/v1/users/:name/mentions` | body `currency` | `USD` |
| `POST /query/v1/users/:name/comments` | body `currency` | `USD` |
| `POST /query/v1/users/:name/threads` | body `currency` | `USD` |

Supported values: `SUPPORTED_CURRENCIES` in `@opden-data-layer/core`. Invalid values fall back to `USD`.

Rates: WAIV/USD from `CurrencyQueryService.engineCurrent()`; fiat crosses from `legacyRateLatest('USD', …)`.

## Data sources

| Endpoint | Hive fields | WAIV |
|----------|-------------|------|
| Single post | ODL `posts` row | `total_payout_waiv`, `total_rewards_waiv` |
| Blog / mentions | ODL post page | batch from `posts` |
| Comments / threads (Hive) | Hive content mappers | batch `findPostsByKeys` |
| Discussion | Hive `getState` nodes | batch `findPostsByKeys` for all comment keys |

Threads feed items without Hive payout fields keep `reward: null`.

## Implementation

- `PostRewardService` — `apps/query-api/src/domain/feed/post-reward.service.ts`
- USD math — `calculate-post-reward-usd.ts` (legacy `calculatePayout` port)
- Discussion batch — `enrich-discussion-comments-rewards.ts`

## Out of scope (v1)

- Campaign sponsor obligations (`additionalSponsorObligations`)
- User profile currency preference on web (clients send `USD` for now)
