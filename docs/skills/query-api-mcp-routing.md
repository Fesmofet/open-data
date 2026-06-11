---
title: Query API MCP routing for agents
description: First-visit map for query-api MCP live-data tools and how they differ from knowledge-api docs search.
type: skill
status: active
scope: platform
tags: [query-api, mcp, agent, routing, live-data]
updated_at: 2026-06-11
related:
  - docs/apps/query-api/spec/mcp.md
  - docs/apps/query-api/spec/overview.md
  - docs/skills/knowledge-api-routing.md
  - docs/README.md
---

# Query API MCP routing for agents

## When to use

- You need **live platform data** (objects, users, posts, feeds, shop listings, currency rates).
- You are connected to **query-api** MCP (`POST /query/mcp`).
- You already know what to fetch and need the right tool name or HTTP parity.

## When not to use

- You need **how/why** a feature works — use **knowledge-api** (`search_knowledge`, `resolve_doc`, `docs/apps/query-api/spec/`).
- You need to **write** drafts or authenticated mutations — not exposed via MCP.
- You confuse `search` (live) with `search_knowledge` (indexed docs) — they are different servers.

## First visit steps

1. Read MCP **server instructions** on `initialize` or resource `odl-query://routing`.
2. Read `odl-query://catalog/tools` — JSON tool list with HTTP equivalents.
3. Pick a tool from the decision table below.
4. Pass `locale`, `viewer`, `governance_object_id` when personalization or governance masking matters.

## Decision table

| User intent | Tool |
|-------------|------|
| Header / quick lookup | `search`, `search_counts` |
| Discover browse by type/tags | `discover_objects`, `discover_tag_categories` |
| Object detail projection | `resolve_object` |
| Related / similar / add-on rails | `get_object_related`, `get_object_similar`, `get_object_add_on` |
| Object update history | `get_object_updates` |
| User profile shell | `get_user_profile` |
| User feeds | `get_user_blog`, `get_user_threads`, `get_user_comments`, `get_user_mentions` |
| User shop | `get_user_categories`, `get_user_shop_objects`, `get_user_shop_sections` |
| Post + comment tree | `get_post`, `get_post_discussion` |
| Rates / rewards display | `get_currency_*`, `get_engine_*` |

## Contrast with knowledge-api

| | query-api MCP | knowledge-api MCP |
|--|---------------|-------------------|
| Data | Live DB / Hive | Indexed markdown specs |
| Search tool | `search` | `search_knowledge` |
| Object shape docs | `resolve_object` returns data | `get_object_type` / specs |
| Onboarding | `odl-query://routing` | `odl-knowledge://routing` |

## MCP resources

| URI | Content |
|-----|---------|
| `odl-query://routing` | This routing map |
| `odl-query://catalog/tools` | Tool catalog JSON |

Canonical detail: [query-api MCP spec](../apps/query-api/spec/mcp.md).

## Verification

- `tools/list` on `POST /query/mcp` includes `resolve_object`, `search`, `get_post_discussion`.
- Resource `odl-query://catalog/tools` returns 30 tools.
