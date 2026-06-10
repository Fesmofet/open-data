# knowledge-api

MCP HTTP service for agent access to project documentation, skills, lessons, and ODL object/update registries.

## Stack

- NestJS, Kysely + Postgres (`knowledge_files`, `knowledge_chunks`)
- `@modelcontextprotocol/sdk` — Streamable HTTP, stateless `POST /knowledge/mcp`
- Default port **7400** (`KNOWLEDGE_API_PORT`)

## MCP tools

| Tool | Source |
|------|--------|
| `search_knowledge` | Postgres FTS on indexed chunks |
| `get_file` | Full markdown body from `knowledge_files` |
| `get_context` | Search + dedupe + optional `AGENTS.md` chunk |
| `list_files` | Filter by type, scope, tags, status |
| `list_tags` | Tag frequency from indexed files |
| `reindex` | In-process reindex (dev only; `KNOWLEDGE_ALLOW_REINDEX=true`) |
| `list_object_types` | `OBJECT_TYPE_REGISTRY` (live) |
| `get_object_type` | Registry + supported/supposed updates |
| `list_update_types` | `UPDATE_REGISTRY` (live) |
| `get_update_schema` | Zod → JSON Schema + example payload |

## Indexing (migrator one-shot)

After migrations:

```bash
docker compose -p apps run --rm migrator pnpm exec tsx libs/migrations/src/cli.ts latest
docker compose -p apps run --rm migrator pnpm exec tsx --tsconfig tsconfig.base.json scripts/knowledge-reindex.ts
```

Local dev:

```bash
pnpm knowledge:reindex
pnpm nx serve knowledge-api
```

## Cursor MCP config

```json
{
  "mcpServers": {
    "odl-knowledge": {
      "url": "http://localhost:7400/knowledge/mcp"
    }
  }
}
```

## Verification

```bash
pnpm nx build knowledge-api
curl -s -X POST http://localhost:7400/knowledge/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```
