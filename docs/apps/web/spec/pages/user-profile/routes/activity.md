---
id: web-pages-user-profile-routes-activity
title: User profile — activity tab
description: "On-chain account history timeline at `/@:name/activity`. Not a Story/feed post list."
type: spec
status: active
scope: web
tags: [web, page, user-profile, activity]
updated_at: 2026-06-17
related:
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/query-api/spec/user-activity-endpoint.md
  - docs/apps/web/spec/pages/user-profile/routes/feed.md
---

# User profile — activity tab

**Back:** [profile shell](../profile-shell.md) · [feed tabs](feed.md)

## Route

| Public URL | App Router file |
|------------|-----------------|
| `/@:name/activity` | `(main)/activity/page.tsx` |

Loading skeleton: `(main)/activity/loading.tsx` (`FeedListSkeleton`).

## Data

- `POST /query/v1/users/:name/activity` via [`user-activity`](../../../../../apps/web/src/modules/user-activity/) module.
- RSC: `getUserActivityPageQuery` → `ActivityFeedClient` with `initialPage` + optional `initialError`.
- Load more: `loadMoreUserActivityAction` + `useSyncedPaginatedList` + `useInfiniteScroll` (20 per page).
- Ordering: **newest at top**; scroll appends older pages.
- Cache tag: `query-api:user-activity-feed:{name}`; invalidated in `revalidateUserFeedAfterBroadcast` after vote/comment/reblog broadcasts.

## UI model

Each row is an **activity operation card** (`ActivityRowShell`), not `Story` / `FeedList`.

### Row kinds (`buildActivityRowView`)

| Kind | Hive / source | UI summary |
|------|---------------|------------|
| `vote` | `vote` | Up/down/unvote + weight % + post link |
| `comment` | `comment` | Post or reply |
| `delete_comment` | `delete_comment` | Deleted comment link |
| `custom_follow` | `custom_json` follow | Follow / unfollow / ignore user |
| `custom_reblog` | `custom_json` reblog | Reblogged post |
| `custom_follow_object` | `custom_json` follow_object | Follow / unfollow object |
| `account_create` | `account_create*` | Created account |
| `account_update` | `account_update*` | Account updated |
| `reward_author` | `author_reward` | Author reward + post |
| `reward_curation` | `curation_reward` | Curation reward HP + post |
| `witness_vote` | `account_witness_vote` | Approve / unapprove witness |
| `wallet_transfer` | `transfer` | Received / transferred + counterparty |
| `wallet_power_up` | `transfer_to_vesting` | Power up |
| `wallet_savings` | savings ops | Raw op type + amount |
| `wallet_claim_rewards` | `claim_reward_balance` | Claimed rewards |
| `wallet_delegate` | `delegate_vesting_shares` | Delegation HP |
| `wallet_power_down` | power-down ops | Start / stop / route / withdraw |
| `wallet_convert` | convert ops | HBD/HIVE convert |
| `wallet_fill_order` | `fill_order` | Market fill |
| `wallet_limit_order` | `limit_order` | Limit order sell → min receive |
| `generic` | fallback | Raw `type` + field table (`json` one-line scroll) |

`effective_comment_vote` operations are excluded server-side and never rendered.

## i18n

Activity-specific keys (prefix `activity_`): `activity_empty`, `activity_load_more`, `activity_loading`, `activity_error`, row labels in `activity-row-content.tsx`. Shared wallet/social keys (`upvoted`, `followed_user`, `author_reward`, …) reused where possible.

## Empty and error states

| State | Condition | Message key |
|-------|-----------|---------------|
| Empty | `items.length === 0`, no error | `activity_empty` |
| Unavailable | API null / Hive 503 / load-more failure | `activity_error` |
| Invalid response | Zod parse failure on API payload | `activity_error` |

## Module layout

| Piece | Path |
|-------|------|
| Module barrel | `apps/web/src/modules/user-activity/index.ts` |
| API client | `infrastructure/clients/activity.client.ts` |
| Mapper | `application/mappers/build-activity-row-view.ts` |
| Feed UI | `presentation/components/activity-feed.tsx` |
| Route wiring | `feed-profile-content.tsx`, `activity-feed-client.tsx` |

## Verification

`pnpm nx test web --testPathPattern=user-activity` · `pnpm check:web-i18n-utf8` · manual `/@:name/activity` scroll
