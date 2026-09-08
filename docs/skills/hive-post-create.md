---
title: Hive post create
description: Publish a root Hive post (comment + comment_options) with WAIV-eligible tags, optional beneficiaries, and linked ODL objects via agent-wallet.
type: skill
status: active
scope: platform
tags: [hive, post, broadcast, agent, waiv, json_metadata]
related:
  - docs/skills/hive-blockchain-broadcast.md
  - docs/skills/hive-has-agent-wallet.md
  - docs/skills/hive-account-authority-for-agents.md
  - docs/skills/companion-post-workflow.md
  - docs/skills/hive-thread-create.md
  - docs/spec/data-model/post-json-metadata-objects.md
  - docs/apps/chain-indexer/spec/waiv-post-reward.md
---

# Hive post create

Playbook for publishing a **root Hive post** (article, recipe walkthrough, review) with optional links to ODL objects.

## When to use

- User wants to publish a new root post on Hive.
- After `object_create` — companion post that links to the object ([companion-post-workflow.md](companion-post-workflow.md)).
- Only broadcast after **explicit user approval**.

## When not to use

- ODL object create/update — [hive-blockchain-broadcast.md](hive-blockchain-broadcast.md) + `odl_build_*`.
- Reply to an existing post — different `parent_author` / `parent_permlink` (not covered by `hive_build_post`).
- Leo thread on an object (Reviews > Threads) — [hive-thread-create.md](hive-thread-create.md) (single `comment` op, no `hive_build_post`).
- Read-only post lookup — query-api MCP.

## Two ops in one transaction

Order matches the web editor ([`use-editor-post-publish.ts`](../../apps/web/src/modules/editor/application/use-editor-post-publish.ts)):

1. **`comment`** — `title`, `body` (markdown), `json_metadata`
2. **`comment_options`** — reward mode + optional beneficiaries extension

Root post defaults:

- `parent_author: ''`
- `parent_permlink: 'waivio'` (legacy Waivio community; override via `parentPermlink` in `hive_build_post`)

## WAIV-eligible tags (potential WAIV rewards)

`json_metadata.tags` must contain **at least one** tag from:

```json
["waivio", "neoxian", "palnet", "waiv", "food"]
```

- Source of truth: [`WAIV_REWARD_ELIGIBLE_TAGS`](../../libs/core/src/constants/feed.constants.ts) + [`isWaivRewardEligible`](../../libs/core/src/post-reward/is-waiv-reward-eligible.ts)
- Spec: [waiv-post-reward.md](../apps/chain-indexer/spec/waiv-post-reward.md) — without an eligible tag the post is indexed but **does not get WAIV potential**
- **`waivio`** is a common web-editor default, but **do not force it** — recipes may use `food`; cross-posting may use `neoxian` / `palnet` / `waiv`
- Add content tags (topic) in addition to one eligible tag when helpful
- `hive_build_post` **warns** when no eligible tag is present; it does **not** auto-inject tags

## Beneficiaries (optional — user request only)

Hive `comment_options` extension `0` → `comment_payout_beneficiaries`.

- **Purpose (when user asks):** share author rewards with named accounts
- **Do not recommend** beneficiaries to the user
- **Do not default** to `waivio` (or any account) — empty list = author receives 100%
- Web editor UI default (`waivio` 3%) is **not** agent guidance ([`post-editor-defaults.ts`](../../apps/web/src/config/post-editor-defaults.ts))

When beneficiaries are provided explicitly:

- Author **must not** appear in the list — author share = `10000 − Σ weights`
- Each beneficiary: `weight` **100–9900** (percent × 100, Hive basis points)
- Σ weights ≤ **10000**; no duplicate accounts
- `hive_build_post` adds the extension **only** when `beneficiaries.length > 0`

## Linked objects

`json_metadata.objects`: `[{ "object_id": "…", "percent": N }]`

- Sum of percents ∈ **[0, 100]**; companion posts typically use one object at **100**
- Normative: [post-json-metadata-objects.md](../spec/data-model/post-json-metadata-objects.md)
- Object must exist in `objects_core` before broadcast (indexer drops unknown ids)

## Reward mode

| Mode | `percent_hbd` | Notes |
|------|---------------|-------|
| `fifty_fifty` (default) | `10000` | Waivio-compatible 50/50 HBD/HP |
| `hive_power` | `0` | 100% Hive Power |
| `declined` | — | `max_accepted_payout: 0.000 HBD` |

## Agent workflow

1. (Optional) Create or verify ODL object on chain.
2. If posting **as another account** that delegated posting authority to the wallet identity, verify via `get_user_authority_grantors` and set `author` to the **grantor** — see [hive-account-authority-for-agents.md](hive-account-authority-for-agents.md).
3. **`hive_build_post`** (agent-wallet MCP) — returns `ops`, `json_metadata`, `warnings`.
4. Review warnings (especially WAIV-eligible tags).
5. **`wallet_broadcast`** or **`has_broadcast`** — only after user approval.
6. Verify: query-api `GET /query/v1/posts/:author/:permlink` or home feed.

### `hive_build_post` input (summary)

| Field | Required | Notes |
|-------|----------|-------|
| `author` | yes | Hive account |
| `title` | yes | Post title |
| `body` | yes | Markdown body |
| `permlink` | no | Slug from title when omitted |
| `tags` | no | Hive categories; include ≥1 WAIV-eligible tag for WAIV potential |
| `objects` | no | `{ object_id, percent }[]` |
| `beneficiaries` | no | Omit unless user requests — **no default** |
| `rewardMode` | no | `fifty_fifty` \| `hive_power` \| `declined` |
| `parentPermlink` | no | Default `waivio` |
| `app` | no | Default `waivio/1.0.0` |
| `host` | no | Site host for `json_metadata.host` |

Returns: `{ ops, opsCount: 2, json_metadata, warnings }`.

## Companion posts

For “post about a created object”, read [companion-post-workflow.md](companion-post-workflow.md) first, then follow this skill for build + broadcast.

## Related

- [Hive blockchain broadcast](hive-blockchain-broadcast.md) — signing and ODL ops
- [HAS agent wallet](../apps/agent-wallet/spec/overview.md) — `hive_build_post`, `wallet_broadcast`
- [Companion post workflow](companion-post-workflow.md) — object-linking add-on
