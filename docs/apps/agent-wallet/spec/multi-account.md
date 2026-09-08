---
id: docs-apps-agent-wallet-spec-multi-account
title: Multi-account local signing
description: JSON account registry, per-account Waivio tokens, signer resolution, and notifications WS.
type: spec
status: active
scope: agent-wallet
tags: [agent-wallet, multi-account, local-keys, waivio-auth]
updated_at: 2026-09-08
related:
  - docs/apps/agent-wallet/spec/overview.md
---

# Multi-account local signing

## accounts.json schema

Path: `AGENT_WALLET_ACCOUNTS_FILE` or `<AGENT_WALLET_DATA_DIR>/accounts.json`.

```json
[
  {
    "account": "waivio.import",
    "keys": {
      "posting": "5J...",
      "active": "5K...",
      "memo": "5H...",
      "owner": "5H..."
    }
  },
  {
    "account": "flowmaster",
    "keys": { "posting": "5J..." }
  }
]
```

- `posting` is required.
- `active`, `memo`, `owner` are optional.
- Account names are normalized (`@` stripped, lowercased).

## Source priority

1. Valid `accounts.json` → `accountsSource: file`
2. Else `HIVE_ACCOUNT` + `HIVE_POSTING_KEY` env → `accountsSource: env`
3. Else empty registry → `accountsSource: none` (HAS-only daemon)

Unreadable or invalid JSON logs a warning and falls back to env.

## Signer resolution

`wallet_broadcast({ account? })` uses `WalletSignerResolverService`:

| Input | Rule |
|-------|------|
| Explicit `account` in local registry | `mode: local` |
| Explicit `account` matches active HAS session | `mode: has` |
| Explicit unknown account | error with configured list |
| No `account`, `AGENT_WALLET_SIGNING_MODE=has` | active HAS session, else default registry account |
| No `account`, `AGENT_WALLET_SIGNING_MODE=local` | default registry account, else active HAS session |

Default account = first entry in the registry.

## Waivio tokens

Per-account refresh tokens: `<dataDir>/waivio-auth/<account>.json` (mode `0600`, directory `0700`).

On startup, legacy `<dataDir>/waivio-auth-session.json` is migrated to the per-account path and deleted.

Access JWTs stay in memory only.

Tools accepting optional `account`: `waivio_auth_start`, `waivio_auth_logout`, `ipfs_upload_image`, `notifications_pull`, `notifications_status`, `osl_memo_encrypt`, `osl_memo_decrypt`.

## Notifications WS

One WebSocket per authorized Waivio account. Buffered items include `account`. `notifications_pull({ account? })` filters without dropping other accounts' items.

## MCP discovery

- `wallet_accounts` — list all configured accounts with readiness (no secrets)
- `wallet_status` — default-account summary + `localAccounts[]`

## Security notes

- Owner keys are validated for readiness but **never** used for broadcast.
- Hive account names are validated before use in filesystem paths.
- Do not commit `accounts.json` — it is listed in the repo `.gitignore` when stored under the data dir.
