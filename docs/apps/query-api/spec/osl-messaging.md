---
id: docs-apps-query-api-spec-osl-messaging
title: OSL messaging API
description: Channels list, message history, object channel feeds.
type: spec
status: active
scope: query-api
tags: [query-api, messaging]
---

# OSL messaging API (v1)

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| POST | `/query/v1/channels/{id}/read` | Body `{ last_read_at_unix }`; member-only; monotonic update |
| GET | `/query/v1/channels` | Requires `X-Viewer`; items include `unread_count`, `image`, `last_message_preview`, `last_message_encrypted` |
| GET | `/query/v1/channels/{id}` | Member required (except object `public_read` via object route) |
| GET | `/query/v1/channels/by-alias/{alias}` | Resolve `dm:` / `obj:` aliases |
| POST | `/query/v1/channels/{id}/messages` | Keyset cursor `(created_at_unix, event_seq)` |
| GET | `/query/v1/objects/{object_id}/channel` | Default object channel meta |
| POST | `/query/v1/objects/{object_id}/channel/messages` | Public read; governance + viewer mute filters |
| GET | `/query/v1/users/{account}/memo-public-key` | Public memo key for encryption; 404 if account missing |

## Message DTO encryption fields

`MessageDto` includes:

| Field | Description |
|-------|-------------|
| `encrypted_body` | Ciphertext or `null` for plaintext |
| `encryption` | `{ v, mode, to }` or `null` |

Server **never** decrypts. Channel list preview: encrypted last message → `last_message_preview: null`, `last_message_encrypted: true` (ciphertext never in preview).

## DM projection

- `display_title` = peer account for viewer
- `list_title` = sorted members joined with ` & `

## Object channel feed

Excludes authors in governance `muted` and (when `X-Viewer` set) viewer `user_account_mutes`.

## Channel detail extensions

`GET /query/v1/channels/{id}` includes:

| Field | Description |
|-------|-------------|
| `members[]` | `{ account, role: "admin" \| "member" }`. For `kind=object` always `[]` (no membership roster). |
| `viewer_role` | Viewer's role or `null` |
| `leave_policy` | `{ can_leave, requires_successor, eligible_successors[] }` |

Dissolved channels (`dissolved_at_unix` set) return 404 and are excluded from `GET /query/v1/channels`.

`leave_policy.requires_successor` is `true` when the viewer is the sole admin among 2+ members.

## Validate members (preflight)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/query/v1/channels/{id}/validate-members` | Group admin + `X-Viewer`; body `{ accounts[] }` |
| POST | `/query/v1/channels/validate-invitees` | New group create; body `{ accounts[] }` |

Response: `{ results: [{ account, addable, reason? }] }` where `reason` is one of `muted_by_viewer`, `muted_viewer`, `governance_muted`, `already_member`, `group_full`.

Max group size: **100** members (including creator).
