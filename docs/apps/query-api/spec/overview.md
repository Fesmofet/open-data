---
id: docs-apps-query-api-spec-overview
title: query-api
description: Read-path HTTP API for objects, feeds, search, and governance-masked projections.
type: overview
status: active
scope: query-api
tags: [query-api, overview]
updated_at: 2026-06-10
related:
  - docs/README.md
  - docs/spec/objects-domain.md
  - docs/spec/governance-resolution.md
  - docs/apps/chain-indexer/spec/overview.md
---

# query-api

Read-path API — governance masking, object resolution (via shared domain libraries).

**Back:** [Documentation index](../../../README.md) · **Related:** [Objects domain](../../../spec/objects-domain.md), [Governance resolution](../../../spec/governance-resolution.md), [chain-indexer](../../chain-indexer/spec/overview.md) (write path)

## Purpose

The **query-api** application is the **read path**: it serves HTTP endpoints that assemble **ResolvedView** payloads with tenant- and request-scoped governance masks applied. It does **not** ingest blockchain data; neutral state comes from **chain-indexer** (see [architecture overview](../../../architecture/overview.md)).

## Feature specs

| Feature | Description |
|---------|-------------|
| [User profile endpoint](users-profile-endpoint.md) | `GET /query/v1/users/:name/profile` |
| [User social lists](user-social-lists.md) | `GET .../:name/followers`, `/following`, `/following-objects` |
| [Shop categories](categories.md) | `GET /query/v1/users/:name/categories` |
| [Shop / recipe object feeds](shop-feed-endpoints.md) | `GET .../shop-objects`, `GET .../shop-sections` |
| [User blog feed endpoint](user-blog-feed-endpoint.md) | `POST /query/v1/users/:name/blog` |
| [User threads feed endpoint](user-threads-feed-endpoint.md) | `POST /query/v1/users/:name/threads` |
| [User comments feed endpoint](user-comments-feed-endpoint.md) | `POST /query/v1/users/:name/comments` (Hive) |
| [User mentions feed endpoint](user-mentions-feed-endpoint.md) | `POST /query/v1/users/:name/mentions` (`post_mentions`) |
| [Single post endpoint](single-post-endpoint.md) | `GET /query/v1/posts/:author/:permlink` |
| [Post discussion endpoint](post-discussion-endpoint.md) | `GET /query/v1/posts/:author/:permlink/discussion` |
| [Post reward](post-reward.md) | `reward` + `waivRewardEligible` on post payloads |
| [User post drafts](user-post-drafts-endpoint.md) | Draft CRUD (Bearer JWT, same `JWT_SECRET` as auth-api) |
| [Search](search.md) | `GET /query/v1/search`, `GET /query/v1/search/counts` |
| [Objects resolve](objects-resolve.md) | `POST /query/v1/objects/resolve` (`aggregateRating` semantics) |
| [Object avatar fallback](object-avatar-fallback.md) | `fields.image` from parent when child has no `image` |
| [Object ref lists](object-ref-list-endpoints.md) | `GET .../related`, `/similar`, `/add-on` |
| [Object SEO](object-seo.md) | SEO fields on resolved objects |
| [MCP agent mirror](mcp.md) | `POST /query/mcp` — live data tools for agents |

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx serve query-api` | Dev server |
| `pnpm nx build query-api` | Production build |
| `pnpm nx test query-api` | Unit tests |

**Related code:** [`apps/query-api/`](../../../../apps/query-api/).
