---
id: web-feed
title: Feed
description: Feed rows render `Story` (via `StoryContainer`) with stats, overflow menu, and optional media.
type: spec
status: active
scope: web
tags: [web, feed]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
---

# Feed (story list)

**Related:** [Story container](components/story-container.md), [auth](auth.md), [architecture](architecture.md), [Profile activity tab](pages/user-profile/routes/activity.md) (Hive account history — not `Story` rows), [Home page](pages/home/page.md) (hub FEED tab).

## Hub home feed

Route `/` under `(app)/(hub)` renders a paginated post timeline for guests (global root posts) and logged-in users (personalized). Uses the same `Story` / `FeedList` / `FeedPostGrid` components as profile feeds. Data: `POST /query/v1/posts/feed` — see [home page spec](pages/home/page.md) and [query-api home feed](../../../query-api/spec/home-feed.md).

## Profile activity tab

The `/@:name/activity` route uses **`ActivityRowShell`** cards from `@/modules/user-activity`, not this feed `Story` list. See [activity.md](pages/user-profile/routes/activity.md).

## Story cards

Feed rows render `Story` (via `StoryContainer`) with stats, overflow menu, and optional media.

## Post reward badge

Reward display uses server-computed `reward` from query-api (Plan A). The web app does not calculate payouts locally.

- **`StoryRewardBadge`** — footer label (`reward.label`), accent when `waivRewardEligible`, WAIV logo tooltip (`eligible_for_waiv`), optional 100% HP flashlight hint (`rewardPowerOnly`).
- **Hover** — `StoryRewardTooltip` + `StoryRewardDetail` (`variant="tooltip"`): currency breakdown, beneficiaries (percent), cashout / author/curator lines.
- **Click** — opens `StoryRewardModal` with full breakdown, beneficiary payout amounts, and curators row in potential phase.
- Used on feed **`Story`**, **`BlogPostScreen`**, and discussion **`StoryCommentRow`** when `comment.reward` is set.
- Feed/post clients pass `currency=USD` until user settings supply a preference.

## Linked object cards

Post bodies and discover use shared **`ObjectCard`** — see [object-card.md](object-card.md) (rating grid, favorite heart, description).

## Comment thread (feed rows)

- Comment icon toggles thread + editor (collapsed by default, including when `children === 0`).
- When expanded and the post has replies, the web app loads **`GET /query/v1/posts/{author}/{permlink}/discussion`** (Hive `bridge.get_discussion` via query-api).
- Feed cards (`layout="quick"`): comment list without sort UI (legacy `isQuickComments`; default sort **NEWEST**).
- Full post / modal (`BlogPostScreen`, `layout="full"`): **Comments** heading + legacy-style **Sort by** dropdown (**BEST**, **NEWEST**, **OLDEST**, **AUTHOR_REPUTATION**).
- Nested replies, per-comment **`StoryVoteButton`**, and reply editors in both layouts.
- Reblog uses **`StoryReblogButton`** (`buildReblogOp`); accent state follows `rebloggedByViewer` from the blog feed or discussion payload.

## Comment editor (logged-in)

When the viewer is logged in (`currentUsername` set), each story card shows **`StoryCommentEditor`** below the comment thread (`apps/web/src/modules/feed/presentation/components/story-comment-editor.tsx`).

- Uses **`LexicalPostEditor`** from `@/modules/editor` (compact layout) — same Lexical surface as the main post editor, without title or draft autosave.
- Submit builds a Hive **`comment`** operation (`buildCommentOp`) and broadcasts via **`getWalletFacade().broadcast`** (`@/modules/auth`).
- After a full page reload, **`useHydrateWalletProvider`** restores Keychain as the active wallet provider from `sessionStorage` (set on Keychain login) so broadcast works without signing in again.

## Likes (Hive vote)

The like control is **`StoryVoteButton`** (`story-vote-button.tsx`), used on feed **`Story`** rows and on full post **`BlogPostScreen`** (see [post-article.md](pages/user-profile/routes/post-article.md) in the profile route specs).

- **Broadcast:** `buildVoteOp` + **`getWalletFacade().broadcast`**, with **`useHydrateWalletProvider`** (same wallet session pattern as comments).
- **Default weights:** `HIVE_VOTE_WEIGHT_FULL` (10000) vs `HIVE_VOTE_WEIGHT_CLEAR` (0) via **`defaultResolveVoteWeight`** in [`domain/vote-weight.ts`](../../../../apps/web/src/modules/feed/domain/vote-weight.ts). Extend behavior with **`VoteWeightContext`** and an optional **`resolveVoteWeight`** prop on `StoryVoteButton` (e.g. future slider / custom %).
- **UI:** Optimistic count toggle on success; guests see a disabled control. After broadcast, **`refreshAfterBroadcast`** updates server counts.
- **Hover:** Native `title` via `formatVoteSummary` (unchanged).
- **Click count:** Opens **`StoryVoteModal`** — tabs for upvotes/downvotes, voter avatar, USD value, and vote %; paginated via **`GET /query/v1/posts/{author}/{permlink}/voters`** (`loadPostVotersAction`). Thumb icon click still toggles the vote.
- **Threads tab:** Pass `contentType="thread"` so query-api reads `thread_active_votes`.
