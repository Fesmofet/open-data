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
| GET | `/query/v1/channels` | Requires `X-Viewer`; items include `unread_count`, `image`, `last_message_preview` |
| GET | `/query/v1/channels/{id}` | Member required (except object `public_read` via object route) |
| GET | `/query/v1/channels/by-alias/{alias}` | Resolve `dm:` / `obj:` aliases |
| POST | `/query/v1/channels/{id}/messages` | Keyset cursor `(created_at_unix, event_seq)` |
| GET | `/query/v1/objects/{object_id}/channel` | Default object channel meta |
| POST | `/query/v1/objects/{object_id}/channel/messages` | Public read; governance + viewer mute filters |

## DM projection

- `display_title` = peer account for viewer
- `list_title` = sorted members joined with ` & `

## Object channel feed

Excludes authors in governance `muted` and (when `X-Viewer` set) viewer `user_account_mutes`.
