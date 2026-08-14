---
id: docs-apps-auth-api-spec-challenge-flow
title: auth-api — challenge and login flows
description: Global HTTP prefix is `auth` (see `apps/auth-api/src/main.ts`); controller routes are versioned under `v1`.
type: spec
status: active
scope: auth-api
tags: [auth-api, challenge-flow]
updated_at: 2026-06-10
related:
  - docs/apps/auth-api/overview.md
  - docs/README.md
---

# auth-api — challenge and login flows

**Back:** [overview](../overview.md)

## Endpoints (base URL `{origin}/auth/v1`)

Global HTTP prefix is `auth` (see `apps/auth-api/src/main.ts`); controller routes are versioned under `v1`.

| Method | Path | Role |
|--------|------|------|
| POST | `/auth/v1/challenge` | Start login; returns `challengeId`, `message`, `expiresAt`; HiveSigner also returns `authorizeUrl`, `state` |
| POST | `/auth/v1/verify/keychain` | Verify Keychain `requestSignBuffer` signature against posting key |
| POST | `/auth/v1/verify/hiveauth` | Verify HiveAuth completion payload (`authData` JSON) |
| GET | `/auth/v1/callback/hivesigner` | OAuth callback: `code`, `state`; exchanges token, loads Hive account |
| POST | `/auth/v1/refresh` | Rotate tokens using refresh JWT |
| POST | `/auth/v1/logout` | Revoke refresh session |

## Keychain

1. Client requests `POST /auth/v1/challenge` with `{ provider: "keychain", username }`.
2. User signs `message` with Hive Keychain (Posting).
3. Client sends `POST /auth/v1/verify/keychain` with `challengeId`, `username`, `signature`, `signedMessage`.
4. Server verifies signature with `@hiveio/dhive`, marks challenge used, issues JWTs.

## HiveAuth

1. Client requests `POST /auth/v1/challenge` with `{ provider: "hiveauth", username }`.
2. User completes HAS + PKSA flow; client builds `authData` JSON with `username`, `expire` (unix seconds), `challenge` (server message), `pubkey`, and `signature` (signed challenge proof from HAS `challenge_data`).
3. Client sends `POST /auth/v1/verify/hiveauth` with `challengeId`, `username`, `authData`. Server verifies ECDSA signature against posting authority before issuing JWTs.

## HiveSigner

1. Client requests `POST /auth/v1/challenge` with `{ provider: "hivesigner", username }` (requires `HIVESIGNER_*` env).
2. Browser opens `authorizeUrl`; HiveSigner redirects to callback with `access_token` and **`state`** (required).
3. Backend `GET /auth/v1/callback/hivesigner` validates `state`, verifies token via HiveSigner `/api/me`, issues JWTs for the verified account (query `username` must match or be omitted).

## Protected APIs

Validate only the issued access JWT (and refresh chain revocation as needed). Do not accept HiveSigner or HAS tokens directly on domain APIs.
