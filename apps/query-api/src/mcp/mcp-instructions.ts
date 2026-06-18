/** MCP server instructions shown to agents on initialize. */
export const QUERY_API_MCP_INSTRUCTIONS = `Read-only **live data** mirror of query-api (POST /query/mcp). Returns current platform state — not documentation.

This is **not** knowledge-api:
- Do not use search here to learn how features work.
- For specs and field semantics use knowledge-api (search_knowledge / resolve_doc) under docs/apps/query-api/spec/.

First visit:
1. Read resource odl-query://routing or knowledge-api get_file docs/skills/query-api-mcp-routing.md
2. Read odl-query://catalog/tools for the full tool list
3. Pick a tool from the decision table below

Context params (replace HTTP headers):
- locale (default en-US) — content projection
- viewer — Hive account for personalized feeds/votes
- governance_object_id — governance mask override

Decision table:
| Intent | Tool |
|--------|------|
| Quick object/user lookup | search (+ search_counts for tab totals) |
| Browse catalog by type/tags | discover_objects, discover_tag_categories |
| Full object projection | resolve_object |
| Object rails (related/similar/add-on) | get_object_related / get_object_similar / get_object_add_on |
| User profile | get_user_profile |
| User feeds | get_user_blog, get_user_threads, get_user_comments, get_user_mentions, get_user_activity |
| User shop | get_user_categories, get_user_shop_filters, get_user_shop_objects, get_user_shop_sections |
| Single post + comments | get_post, get_post_discussion |
| Token/fiat rates | get_currency_* / get_engine_* |

Excluded: user post drafts (JWT writes) — not exposed via MCP.

Top tools:
- resolve_object — object detail page data
- search — header predictive search
- get_user_profile — profile shell
- get_post — post article with rewards
- discover_objects — discover page listing`;
