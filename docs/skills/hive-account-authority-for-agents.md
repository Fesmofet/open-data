---
id: docs-skills-hive-account-authority-for-agents
title: Hive posting authority for agents
description: Discover delegated posting authority via query-api MCP; grant or revoke posting account_auths; act as grantor with the grantee posting key via agent-wallet local env keys.
type: skill
status: active
scope: platform
tags: [hive, authority, delegation, agent-wallet, query-api, posting, account_update]
updated_at: 2026-09-08
related:
  - docs/skills/query-api-mcp-routing.md
  - docs/skills/hive-blockchain-broadcast.md
  - docs/skills/hive-post-create.md
  - docs/skills/hive-has-agent-wallet.md
  - docs/skills/wallet-delegation-swap-for-agents.md
  - docs/apps/query-api/spec/user-account-auths-endpoint.md
  - docs/apps/agent-wallet/spec/overview.md
---

# Hive posting authority for agents

Hive accounts can delegate **posting**, **active**, or **owner** authority to other accounts via `account_auths`. Agents use **query-api MCP** to discover who delegated to the wallet identity, **agent-wallet** to build ops, and **local env keys** (primary) to sign and broadcast.

## When to use

- Discover which accounts delegated posting (or active/owner) authority **to** the wallet identity — “who can I post as?”
- Publish posts, votes, ODL updates, or posting-key `custom_json` **on behalf of** a grantor account.
- Build a merge-safe `account_update` to grant or revoke posting authority (inbound payload or outbound self-grant when `HIVE_ACTIVE_KEY` is configured).

## When not to use

- HP / RC / Engine token delegations — [wallet-delegation-swap-for-agents.md](wallet-delegation-swap-for-agents.md).
- OSL encrypted messaging (memo key) — [osl-messaging.md](osl-messaging.md).
- Owner authority changes by default — out of scope unless the user explicitly requests it.

## Setup (primary — local env keys)

```bash
AGENT_WALLET_SIGNING_MODE=local
HIVE_ACCOUNT=waivio.import
HIVE_POSTING_KEY=5...
HIVE_ACTIVE_KEY=5...   # optional — required for active ops (grants, transfers, HP delegation)
```

The code default for `AGENT_WALLET_SIGNING_MODE` is still `has`; env-key deployments **must** set `local` explicitly.

1. `wallet_status` — confirm `signingMode`, wallet identity, `postingReady`, `activeReady`.
2. Build ops → `wallet_broadcast({ ops, keyType })` → poll `wallet_broadcast_status`.

**HAS (optional):** phone login + approval — see secondary workflow in [hive-has-agent-wallet.md](hive-has-agent-wallet.md). Use only when env keys are not configured.

## Authority types

| Type | Unlocks | Delegated posting can use it? |
|------|---------|-------------------------------|
| **posting** | Posts, votes, follow, RC delegation, posting `custom_json` | Yes — this skill’s main path |
| **active** | Transfers, HP delegation, `account_update`, active `custom_json` | No — grantor must sign with active key |
| **owner** | Account recovery, owner-only changes | No — never grant by default |

Posting delegation **never** unlocks active operations.

## Act-as rule (name vs key)

> **Names in the op = grantor** (`author`, `voter`, `required_posting_auths`, ODL `creator`).
> **Signature = grantee** (wallet identity posting key).

Example: `flowmaster` granted posting to `waivio.import`:

- `hive_build_post({ author: "flowmaster", ... })` — not `author: "waivio.import"`
- `wallet_broadcast({ ops, keyType: "posting" })` while wallet identity is `waivio.import`

## Discover grantors (query-api MCP)

| Tool | Purpose |
|------|---------|
| `get_user_authority_grantors` | Who delegated owner/active/posting **to** `{account}` — use with wallet identity for “who I can act as” |
| `get_user_authority_grantees` | Who received authority **from** `{account}` |

Example:

```json
get_user_authority_grantors({ "account": "waivio.import", "type": "posting" })
→ { "grantor": "flowmaster", "authorityType": "posting" }
```

**404** on the route means the account is absent from `accounts_current`, not “no grantors”. Fall back to Hive `condenser_api.get_accounts([grantor])` and inspect `posting.account_auths`. Indexer may lag seconds after a grant tx.

HTTP parity: [user-account-auths-endpoint.md](../apps/query-api/spec/user-account-auths-endpoint.md).

## Pre-flight before acting as grantor

1. `wallet_status` — wallet identity, `postingReady`.
2. `get_user_authority_grantors({ account: <wallet identity>, type: "posting" })` — grantor must appear.
3. On empty/404, Hive `get_accounts` fallback on the grantor.
4. Build with grantor names, broadcast with `keyType: "posting"`.

## Grant / revoke posting authority

**Operation:** `account_update` with live `posting`, `memo_key`, `json_metadata` from `get_accounts`. Signed with grantor **active** key (`keyType: active`). Do **not** use `account_update2` for `posting.account_auths` mutations.

**Builder:** `hive_build_posting_authority_grant({ account, grantee, action: "add" | "remove" })`

Returns `{ ops, opsCount, keyType: "active", signerAccount, canSignLocally, warnings }`.

| Direction | signerAccount vs wallet | canSignLocally | Action |
|-----------|-------------------------|----------------|--------|
| Inbound (others → agent) | different | false | Payload for grantor to sign elsewhere |
| Outbound (agent → others) | same + `activeReady` | true | `wallet_broadcast({ keyType: "active" })` after user approval |
| Outbound, no active key | same, not activeReady | false | Payload only |
| HAS, session is grantor | same | false | `has_broadcast({ keyType: "active" })` — phone approval |

**Confirm with the user** before any grant, revoke, transfer, or other value-moving active broadcast. Posting-key ops need no such prompt.

`HIVE_ACTIVE_KEY` also unlocks transfers, HP delegation, and all other active ops via `wallet_broadcast` — not only authority grants.

## Who can broadcast what

| Tx | Signer identity | keyType | Local env keys | HAS |
|----|-----------------|---------|----------------|-----|
| Grant/revoke posting | grantor | `active` | When wallet = grantor and `activeReady` | Grantor session + active approval |
| Post/vote/ODL as grantor | grantee (wallet) | `posting` | Normal agent path | Phone approval |

`wallet_broadcast` / `has_broadcast` take **no account argument** — one wallet identity per daemon today. Put delegated account names **inside** the ops.

## Worked example (local env keys)

`waivio.import` publishes a post authored by `flowmaster`:

1. `wallet_status` → `localKeys.account` = `waivio.import`, `postingReady: true`
2. `get_user_authority_grantors({ account: "waivio.import", type: "posting" })` → includes `flowmaster`
3. `hive_build_post({ author: "flowmaster", title: "...", body: "..." })`
4. `wallet_broadcast({ ops, keyType: "posting" })`
5. Verify via `get_post` / query-api

## Error mapping

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Missing Posting Authority` | Wallet not in grantor `posting.account_auths`, or names/signer swapped | Re-run pre-flight |
| `Missing Active Authority` | Grant with posting key, or active op via delegated posting | Grantor signs grant; active ops need active key |
| `HIVE_ACTIVE_KEY is required for active operations` | Local mode without valid active key | Check `wallet_status.localKeys.activeReady` |
| query-api `404` on authority route | Account not in `accounts_current` | Hive `get_accounts` fallback |
| Empty grantors right after grant | Indexer lag | Retry or Hive fallback |

## Safety

- Never drop existing `key_auths` when merging `account_auths`.
- Never grant owner authority unless the user explicitly asks.
- Confirm grantor identity before acting as them.
- Keys never logged or echoed in tool output.

## Forward compatibility (not available yet)

A future refactor will load multiple accounts with keys from a JSON file. Build tools already return `signerAccount` + `keyType` for a future key resolver. Optional `signerAccount` on `wallet_broadcast` is planned but not implemented.

## Related

- [Query API MCP routing](query-api-mcp-routing.md) — live data tools
- [Hive blockchain broadcast](hive-blockchain-broadcast.md) — ODL ops; on-behalf posting uses grantor names in ops
- [Hive post create](hive-post-create.md) — `author` may be a grantor
- [HAS agent wallet](hive-has-agent-wallet.md) — optional HAS signing path
- [agent-wallet overview](../apps/agent-wallet/spec/overview.md)
