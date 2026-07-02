---
id: docs-apps-chain-indexer-spec-post-languages
title: Post language detection
description: ELD-based language detection on Hive comment upsert; writes post_languages rows.
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, posts, language]
updated_at: 2026-07-02
related:
  - docs/spec/data-model/post-languages.md
  - docs/apps/chain-indexer/spec/hive-ingestion.md
---

# Post language detection

## Purpose

Detect languages from Hive post title + body on indexer upsert and persist canonical tags in `post_languages`.

## Detection library

- Package: [`eld`](https://www.npmjs.com/package/eld) (`eld/small` ESM submodule)
- Code: `apps/chain-indexer/src/domain/hive-comment/post-languages.ts`

Text input: `title + "\n\n" + body` (whichever is non-empty).

## Policy

| Constant | Value | Effect |
|----------|-------|--------|
| `SCORE_TIE_RATIO` | `0.92` | Keep languages within 92% of top ELD score |
| `MAX_DETECTED_LANGUAGES` | `2` | Cap stored tags per post |

Each code is canonicalized with `Intl.getCanonicalLocales(code)[0]` → primary subtag (`en`, `es`, …).

## Trigger

`PostUpsertService` calls `detectPostLanguagesBcp47` on comment **create** and **update**, then `PostsRepository` replaces `post_languages` rows in the same transaction.

## Storage contract

See [post-languages data model](../../../spec/data-model/post-languages.md) — stored values are **primary subtags**, not `en-US`.

## Verification

```bash
pnpm nx test chain-indexer --testPathPatterns=post-languages
```

Unit tests use `languagesFromEldScores()` directly (Jest cannot load the dynamic `eld/small` import).
