---
id: docs-apps-notifications-spec-event-catalog
title: Notification event catalog
description: Non-campaign notification types, wire payloads, and default recipients.
type: spec
status: active
scope: notifications
tags: [notifications, events]
updated_at: 2026-07-28
related:
  - docs/apps/notifications/spec/transport.md
  - docs/apps/notifications/spec/routing.md
---

# Notification event catalog

Source of truth for **types and Zod shapes**: `@opden-data-layer/notifications-contract` (`notificationEventSchema`, `NotificationPayloadMap`).

Campaign types (`campaignReservation`, `activationCampaign`, etc.) are **out of scope** for ODL.

## Envelope (all types)

| Field | Type | Notes |
|-------|------|--------|
| `type` | `NotificationEventType` | Discriminator |
| `occurredAt` | ISO string | From block time |
| `blockNum` | number | Hive block |
| `trxId` | string \| null | Hive transaction id |
| `objectId` | string \| null | ODL object when relevant |
| `actor` | string \| null | Primary actor account |
| `payload` | per-type object | See below |

## Social / content

| Type | Payload highlights | Typical recipients |
|------|-------------------|-------------------|
| `reply` | `author`, `permlink`, `parentAuthor`, `parentPermlink`, `isRootPost` | Parent post/comment author |
| `mention` | `author`, `permlink`, `isRootPost`, `mentioned` | Mentioned account |
| `my_post` / `my_comment` | author, permlink, title (post) | Author (self) |
| `vote_like` / `vote_downvote` | voter, author, permlink, weight | Content author |
| `my_vote` | voter, author, permlink, title | Voter (self) |
| `reblog` | account, author, permlink | Post author |
| `follow` | following, action | `following` when action is follow |

Bell types (`bell_post`, `bell_reblog`, …) are emitted from **chain-indexer** for root posts and reblogs (`bell_post`, `bell_reblog`). `bell_follow`, `bell_object_post`, `bell_thread`, and `thread_author_follower` are routed when producers emit them; ODL bell-follow actions are not fully wired yet.

## Wallet (Hive L1)

Notify-only handlers in **chain-indexer** `domain/hive-wallet/` (no Postgres wallet history).

| Type | Notes |
|------|--------|
| `transfer_in` / `transfer_out` | Both sides of `transfer` |
| `transfer_from_savings` | Savings withdrawal |
| `power_up` / `power_down` | Vest flows |
| `claim_reward` | `claim_reward_balance` |
| `witness_vote` | Approve / unapprove |
| `fill_order` | Market fill |
| `withdraw_route` | Withdraw route change |
| `change_recovery_account` | Recovery account change |
| `change_password` | `account_update` with `owner` key present |
| `hp_delegation` | `delegate_vesting_shares` |

## Wallet (Hive Engine)

Emitted from **hive-engine-parser** (e.g. WAIV stake parser): `engine_transfer`, `engine_stake`, `engine_unstake`, `engine_cancel_unstake`, `engine_delegate`, `engine_undelegate`.

## Objects (ODL)

| Type | Notes |
|------|--------|
| `object_update` | Replaces legacy `objectUpdates` / group id via `updateType` |
| `object_status_change` | Status field updates |
| `object_update_reject` | Negative validity vote (`against`) |
| `update_vote_cast` | Positive or neutral object vote notifications |
| `object_created` | Deprecated; router no-op |

For `object_update`, `object_update_reject`, and `object_status_change`, **chain-indexer** fills `payload.objectName` in the notification adapter by resolving the winning `update_type = name` (locale `en-US`, same object-resolution pipeline as query-api). Handlers emit `objectName: null`; if resolution fails, the field stays `null` and the web message builder falls back to `authorPermlink`. The resolved name is **snapshotted** at publish time (renames do not rewrite items already in the Redis feed).

## Service

| Type | Feed | Notes |
|------|------|--------|
| `batch_import_completed` | Yes | IPFS batch import |
| `trx_processed` | No | WebSocket subscribers only |

## Settings gating

`apps/notifications` maps each type to a column on `user_notification_settings` and applies `minimal_transfer` (USD) for inbound transfers via `@opden-data-layer/currency`. If USD rates are unavailable, transfer notifications are **not** dropped.

| Column | Event types | Rule |
|--------|-------------|------|
| `vote` | `vote_like` | `false` → block |
| `downvote` | `vote_downvote` | `false` → block |
| `follow`, `reply`, `mention`, `reblog` | matching social types | `false` → block |
| `my_post`, `my_comment`, `my_like` | `my_post`, `my_comment`, `my_vote` | `false` → block |
| `transfer` | inbound/outbound transfer family | `false` → block; inbound also checks `minimal_transfer` |
| `fill_order`, `power_up`, `claim_reward`, `witness_vote` | matching wallet types | `false` → block |
| `claimed_object_updates` | `object_update`, `object_update_reject`, `update_vote_cast` | `false` → block |
| `group_id_control` | `object_update`, `object_update_reject` | when `payload.updateType === productGroupId`, `false` → block |
| `followed_user_threads` | `bell_thread`, `thread_author_follower` | `false` → block |

`object_status_change` is **not** gated by user settings (column removed in migration `00050`).

Settings are read from Postgres in bulk per stream batch and are not cached. Accounts that are not registered ODL users receive nothing; registered accounts without a row use `DEFAULT_NOTIFICATION_SETTINGS` — see [transport spec](transport.md).
