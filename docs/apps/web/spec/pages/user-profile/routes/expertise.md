---
id: web-pages-user-profile-routes-expertise
title: User profile — expertise
description: "Expertise hashtags and objects under `/@:name/expertise-*`."
type: spec
status: active
scope: web
tags: [web, page, user-profile, expertise]
updated_at: 2026-07-03
related:
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/query-api/spec/user-expertise.md
---

# User profile — expertise

**Back:** [profile shell](../profile-shell.md)

## Purpose

Expertise hashtags and objects under `/@:name/expertise-*`. Lists objects the user earned expertise on (post author payout split by `post_objects.percent` at cashout).

## Routes

| Public URL | App Router file |
|------------|-----------------|
| `/@:name/expertise-hashtags` | `(main)/expertise-hashtags/page.tsx` |
| `/@:name/expertise-objects` | `(main)/expertise-objects/page.tsx` |

Subnav: [user-menu.md](../components/user-menu.md) — shows `Hashtags N` / `Objects N` from expertise counters.

## Data flow

1. Profile layout fetches `GET .../expertise/counters` (with social counts).
2. Each route RSC loads first page via `GET .../expertise/objects?scope=hashtags|objects`.
3. Client `ExpertiseObjectList` infinite-scrolls via server action `loadMoreExpertiseObjects`.
4. `ObjectCard` shows optional `userWeight` badge (two decimal places).

Empty state: `users_start_with_zero_expertise` i18n key.

## Verification

Manual: secondary subnav under Expertise primary tab; badge weights on cards; load more.

```bash
pnpm nx run web:typecheck
```
