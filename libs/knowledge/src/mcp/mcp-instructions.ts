/** MCP server instructions shown to agents on initialize. */
export const KNOWLEDGE_MCP_INSTRUCTIONS = `Project knowledge base (ODL docs, skills, lessons, registries).

First visit workflow:
1. Read resource odl-knowledge://routing (or get_file docs/skills/knowledge-api-routing.md)
2. list_files({ type: "skill" }) — catalog playbooks with description one-liners
3. resolve_doc({ topic: "<user task>" }) → get_file(path) for full markdown
4. get_context({ topic }) — compact chunks when route is unclear

Doc taxonomy:
- skill — procedural playbooks (docs/skills/)
- spec / overview — app and domain behavior
- agents — coding rules (AGENTS.md)
- registry — object/update type reference (also use get_object_type / get_update_schema)

App features: resolve_doc or list_files({ scope: "<app>" }) before search_knowledge.

Key paths:
- docs/skills/knowledge-api-routing.md — MCP routing map (read first if lost)
- docs/skills/setup-workspace.md — sidecar agent / clone repo
- docs/getting-started.md — local dev (Docker, migrate, pnpm nx serve)
- docs/skills/hive-account-signup.md — new Hive account
- docs/skills/hive-blockchain-broadcast.md — sign and broadcast chain ops
- docs/skills/query-api-mcp-routing.md — live-data query-api MCP tools (incl. OBL reads)
- docs/skills/obl-offers-contracts.md — OBL discover/publish/sign contracts
- docs/skills/obl-ledger.md — OBL invoices, payments, balances
- docs/skills/obl-disputes.md — OBL disputes and arbitration
- docs/skills/build-tenant-site.md — create web project; fork apps/web (Next.js); never standalone .html; object-menu or custom UI + query-api
- docs/apps/<app>/spec/ — feature specs

Chain payloads: use get_object_create_playbook (before create), get_object_type, and get_update_schema — not search_knowledge.

Not indexed: .agents/skills/ (Cursor runtime only).`;
