---
id: web-pages-user-profile-routes-social-graph
title: User profile social graph
description: "Followers, following accounts, and following-objects lists under `/@:name`."
type: spec
status: active
scope: web
tags: [web, page, user-profile, social]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/web/spec/user-follow.md
---

# User profile — social graph

**Back:** [profile shell](../profile-shell.md) · [web overview](../../../overview.md) · **Related:** [user-follow.md](../../../user-follow.md)

## Purpose

Followers, following accounts, and following-objects lists under `/@:name`.

## Routes

| Public URL | App Router file | List kind |
|------------|-----------------|-----------|
| `/@:name/followers` | `(main)/followers/page.tsx` | `followers` |
| `/@:name/following` | `(main)/following/page.tsx` | `following` |
| `/@:name/following-objects` | `(main)/following-objects/page.tsx` | `following-objects` |

Shared UI: `UserSocialAccountList` from `@/modules/user-social`.

## Query params

| Param | Values | Effect |
|-------|--------|--------|
| `sort` | `latest` (default), `oldest`, `weight` | Subscription sort — parsed by `parseSubscriptionSortParam` |

## Module layout

| Piece | Location |
|-------|----------|
| Page queries | `getUserFollowersPageQuery`, `getUserFollowingPageQuery`, `getUserFollowingObjectsPageQuery` |
| Load-more actions | `user-profile-social.actions.ts` |
| Broadcast refresh | `revalidateUserSocialAfterBroadcast` after Hive follow / ODL bell |
| Follow UI in rows | [user-follow.md](../../../user-follow.md) |

## Behavior

- Initial page: RSC fetch with `USER_SOCIAL_PAGE_SIZE`, viewer username for follow state.
- Client list: `useSyncedPaginatedList` + infinite scroll; `key={sort}` on sort change.
- Hero counts: `(profile)/layout.tsx` loads following-objects total for badge sync.

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx test web --testPathPattern=user-social` | Sort parsing, list helpers |
| Manual | Follow/unfollow from list; counts refresh after trx confirmation |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/app/(app)/user-profile/[name]/(profile)/(main)/followers/page.tsx` | Followers route |
| `apps/web/src/modules/user-social/presentation/components/user-social-account-list.tsx` | Shared list component |
