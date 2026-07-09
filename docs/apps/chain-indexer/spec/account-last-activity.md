---
id: docs-apps-chain-indexer-spec-account-last-activity
title: Account last activity batch update
description: End-of-block touch of accounts_current.last_activity for every account that appeared in block operations.
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, accounts, last-activity]
updated_at: 2026-07-08
related:
  - docs/apps/chain-indexer/spec/social-parsers.md
  - docs/apps/query-api/spec/users-account-sidebar.md
---

# Account last activity

**Back:** [chain-indexer overview](../overview.md)

## Purpose

Port legacy `userParsers.updateLastActivity` (called after each block in chain-indexer-legacy `mainParser.js`).

## Behavior

At the end of `HiveMainParser.parseBlock`:

1. Collect unique Hive account names from all operations in the block (legacy `userFieldMappings`).
2. `UPDATE accounts_current SET last_activity = GREATEST(COALESCE(last_activity, 0), $blockUnix)` for those names.

Block timestamp is converted to unix seconds. Does not modify other ODL-managed columns on `upsertFromHive`.

## Code

| Piece | Path |
|-------|------|
| Op → account map | `apps/chain-indexer/src/domain/hive-social/account-last-activity.util.ts` |
| Service | `apps/chain-indexer/src/domain/hive-social/account-last-activity.service.ts` |
| Repository | `AccountsCurrentRepository.touchLastActivity` |
| Hook | `HiveMainParser.parseBlock` (after operation loop) |

## Verification

```bash
pnpm nx test chain-indexer --testPathPatterns=account-last-activity
```
