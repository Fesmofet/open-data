---
id: docs-apps-web-spec-pages-user-profile-routes-permissions
title: User profile permissions page
description: Public profile page listing Hive account authority grants with grant/revoke for the owner.
type: spec
status: active
scope: web
tags: [web, user-profile, hive, authority]
updated_at: 2026-09-08
related:
  - docs/apps/web/spec/pages/user-profile/overview.md
  - docs/apps/query-api/spec/user-account-auths-endpoint.md
---

# User profile permissions page

Route: `/@{username}/permissions` (internal: `/user-profile/{name}/permissions`).

Full-width layout under the profile hero (same shell family as map — no left/right rails).

## Tabs

| Tab | API | Actions |
| --- | --- | --- |
| **Granted Authorities** | `GET .../authority-grantees` | Add/remove posting & active when viewer owns profile; owner rows view-only |
| **Received Authorities** | `GET .../authority-grantors` | View only |

Query params: `tab=granted|received` (default granted), `type=posting|active|owner` (omit = all), `sort=rank|followers|a-z|recency` (default `a-z`).

## Entry

Logged-in account menu → **Permissions** (after Wallet). Other profiles are viewable; grant/revoke only when `viewer === profile`.

## Grant / revoke

1. Server action loads live `condenser_api.get_accounts` (never indexer snapshot).
2. `mergeHiveAccountAuths` + `buildAccountUpdateAuthorityOp`.
3. Web wallet facade broadcasts with **Active** key.

After success: `revalidateUserPermissionsAfterBroadcast` invalidates authority list cache tags.

## Module

`apps/web/src/modules/user-permissions/`
