---
id: docs-apps-agent-wallet-spec-overview
title: agent-wallet
description: Local HAS session daemon with MCP tools for agent-driven ODL broadcasts.
type: overview
status: active
scope: agent-wallet
tags: [agent-wallet, has, mcp, overview]
updated_at: 2026-08-12
related:
  - docs/skills/hive-has-agent-wallet.md
  - docs/skills/hive-blockchain-broadcast.md
  - docs/apps/knowledge-api/spec/overview.md
---

# agent-wallet

Local NestJS app: holds a HiveAuth (HAS) session and exposes MCP tools for login, ODL `object_create` build, and broadcast with phone approval.

## Agent first visit

1. Skill: [hive-has-agent-wallet](../../skills/hive-has-agent-wallet.md)
2. Download `agent-wallet.js` from [GitHub Releases](https://github.com/Waiviogit/open-data-layer/releases) (or `pnpm nx serve agent-wallet` from monorepo checkout)
3. Read bearer token from `~/.odl/agent-wallet.token`
4. MCP `POST http://127.0.0.1:7500/agent-wallet/mcp` with `Authorization: Bearer …` (direct JSON-RPC — no `mcp.json`)

## Distribution

| Channel | Use when |
|---------|----------|
| **GitHub Release** (`agent-wallet.js`) | Default for end users and sidecar agents without a repo checkout |
| **Monorepo** (`pnpm nx serve agent-wallet`) | Local development or agent already has a checkout |

CI publishes a **portable archive** (`agent-wallet-portable.tar.gz`: `main.js`, pruned `package.json`, lockfile, install scripts) via [release-agent-wallet workflow](../../../.github/workflows/release-agent-wallet.yml) on tag `agent-wallet-v*`. Run `install.sh` / `install.ps1` on the target machine to install native production deps (`@hiveio/dhive`, `secp256k1`).

**Do not** add `agent-wallet` to server `docker-compose.*.yml` files. It is a per-user localhost daemon with HAS session secrets — hosting it behind nginx would expose signing to the network and break the `127.0.0.1`-only security model.

## Stack

- NestJS, `@modelcontextprotocol/sdk` Streamable HTTP (stateless MCP per request)
- `@opden-data-layer/hive-auth` — `HasClient`
- `@opden-data-layer/hive-broadcast` — `buildObjectCreateEnvelope`
- Default bind **`127.0.0.1:7500`** — no CORS

## Feature specs

| Feature | Doc |
|---------|-----|
| HAS agent wallet (MCP tools, session, security) | [hive-has-agent-wallet skill](../../skills/hive-has-agent-wallet.md) |
| HAS login from chat (Telegram, Slack) | [has-login-from-chat skill](../../skills/has-login-from-chat.md) |
| IPFS image upload + avatar/gallery policy | [ipfs-image-upload skill](../../skills/ipfs-image-upload.md) |

## MCP tools

| Tool | Returns |
|------|---------|
| `has_login_start` | `requestId`, `alreadyActive`, `expiresAt`, `expiresInSec`, `pushSent`, `webLink` (compact fragment), `deepLink` only when no web link is configured |
| `has_login_status` | `pending` (with `account`, `expiresInSec`, `webLink`) / `active` / `rejected` / `expired` |
| `has_login_qr` | `deepLink`, `qrAscii`, optional `qrPngPath` for a pending login — terminal and second-device fallback only |
| `has_session` | `account`, `expiresAt` (no secrets) |
| `has_logout` | — |
| `odl_build_object_create` | `ops`, `opsCount`, `bytes`, `warnings` |
| `has_broadcast` | `requestId` |
| `has_broadcast_status` | `signed` / `rejected` / `error` / `expired`, `transactionId` |
| `wallet_status` | signing mode, HAS/Waivio/local readiness (no secrets) |
| `waivio_auth_start` / `waivio_auth_status` / `waivio_auth_logout` | Waivio JWT session (separate from HAS) |
| `ipfs_upload_image` | `{ cid, url? }` after authenticated upload |
| `wallet_broadcast` / `wallet_broadcast_status` | mode-aware broadcast (HAS or local keys) |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `7500` | HTTP port |
| `HOST` | `127.0.0.1` | Bind address |
| `ODL_NETWORK` | `testnet` | `mainnet` \| `testnet` → `odl-mainnet` / `odl-testnet` |
| `HAS_WS_URL` | `wss://hive-auth.arcange.eu` | HAS WebSocket server |
| `HAS_APP_NAME` | `ODL Agent` | Shown in Keychain auth prompt |
| `HAS_WEB_LINK_BASE` | `https://waiviodev.com` | Origin for clickable `webLink` (`/has#<compact fragment>`); empty disables |
| `WAIVIO_API_ORIGIN` | `https://waiviodev.com` | Base for `/auth/v1` and `/ipfs-gateway` |
| `AGENT_WALLET_SIGNING_MODE` | `has` | `has` \| `local` — broadcast signing provider |
| `HIVE_ACCOUNT` | — | Required in `local` mode |
| `HIVE_POSTING_KEY` | — | Env-only posting WIF for local mode (never persisted) |
| `HIVE_ACTIVE_KEY` | — | Optional env-only active WIF (active ops only) |
| `HIVE_RPC_NODES` | `https://api.hive.blog` | Comma-separated Hive RPC URLs |
| `AGENT_WALLET_DATA_DIR` | `~/.odl` | MCP token + HAS + Waivio refresh session files |
| `AGENT_WALLET_NO_PERSIST` | `false` | Memory-only session when `true` |
| `AGENT_WALLET_BEARER_TOKEN` | — | Fixed token (optional; else auto-generated) |

## Health

`GET /agent-wallet/health` → `{ status, wallet: { signingMode, hasSession, waivioAuth, localKeys } }` (no secrets)

Credential files (when persistence enabled):

| File | Contents |
|------|----------|
| `~/.odl/agent-wallet.token` | MCP bearer only |
| `~/.odl/agent-wallet-session.json` | HAS session only |
| `~/.odl/waivio-auth-session.json` | Waivio refresh token + account metadata only |

## Verification

```bash
pnpm nx test agent-wallet
pnpm nx e2e agent-wallet-e2e
pnpm check:bundle-deps -- --app agent-wallet
pnpm nx serve agent-wallet   # dev only
```

E2E uses in-process fake HAS WebSocket server; real Keychain flow is manual per skill.
