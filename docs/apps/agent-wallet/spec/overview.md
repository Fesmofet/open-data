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

CI publishes `agent-wallet.js` + `agent-wallet.js.sha256` via [release-agent-wallet workflow](../../../.github/workflows/release-agent-wallet.yml) on tag `agent-wallet-v*`.

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

## MCP tools

| Tool | Returns |
|------|---------|
| `has_login_start` | `requestId`, `deepLink`, `qrAscii`, `expiresAt` |
| `has_login_status` | `pending` / `active` / `rejected` / `expired` |
| `has_session` | `account`, `expiresAt` (no secrets) |
| `has_logout` | — |
| `odl_build_object_create` | `ops`, `opsCount`, `bytes`, `warnings` |
| `has_broadcast` | `requestId` |
| `has_broadcast_status` | `signed` / `rejected` / `error` / `expired`, `transactionId` |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `7500` | HTTP port |
| `HOST` | `127.0.0.1` | Bind address |
| `ODL_NETWORK` | `testnet` | `mainnet` \| `testnet` → `odl-mainnet` / `odl-testnet` |
| `HAS_WS_URL` | `wss://hive-auth.arcange.eu` | HAS WebSocket server |
| `HAS_APP_NAME` | `ODL Agent` | Shown in Keychain auth prompt |
| `AGENT_WALLET_DATA_DIR` | `~/.odl` | Token + session directory |
| `AGENT_WALLET_NO_PERSIST` | `false` | Memory-only session when `true` |
| `AGENT_WALLET_BEARER_TOKEN` | — | Fixed token (optional; else auto-generated) |

## Health

`GET /agent-wallet/health` → `{ status, session: { active, account?, expiresAt? } }`

## Verification

```bash
pnpm nx test agent-wallet
pnpm nx e2e agent-wallet-e2e
pnpm check:standalone-bundle
pnpm nx serve agent-wallet   # dev only
```

E2E uses in-process fake HAS WebSocket server; real Keychain flow is manual per skill.
