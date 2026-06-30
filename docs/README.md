---
id: docs-readme
title: Documentation
description: Entry point for Open Data Layer documentation, specs, and agent playbooks.
type: overview
status: active
scope: platform
tags: [platform, onboarding]
updated_at: 2026-06-11
related:
  - docs/skills/knowledge-api-routing.md
  - docs/getting-started.md
  - docs/standards/docs-standards.md
  - docs/skills/hive-account-signup.md
  - docs/skills/hive-blockchain-broadcast.md
  - docs/skills/build-tenant-site.md
---

# Documentation

Entry point for Open Data Layer documentation.

## For agents (first visit)

1. Connect to **knowledge-api** MCP — read server `instructions` on `initialize`.
2. Open [Knowledge API routing](skills/knowledge-api-routing.md) or `get_file` that path.
3. `list_files({ type: "skill" })` — catalog playbooks with `description` one-liners.
4. `get_context({ topic: "<task>" })` before implementing.
5. `.agents/skills/` is **not** indexed — use `docs/skills/` for ODL playbooks.

## Quick links

| Doc | Description |
|-----|-------------|
| [Knowledge API routing](skills/knowledge-api-routing.md) | MCP tools, doc types, first-visit map |
| [Getting started](getting-started.md) | Local setup, migrations, run apps |
| [Architecture overview](architecture/overview.md) | Four-service model, contracts |
| [Specification index](spec/README.md) | Domain specs, data model, governance |
| [Documentation standards](standards/docs-standards.md) | How we write docs |
| [Skills](skills/setup-workspace.md) | Agent playbooks: [create project / tenant site](skills/build-tenant-site.md), [workspace setup](skills/setup-workspace.md), [Hive signup](skills/hive-account-signup.md), [Hive broadcast](skills/hive-blockchain-broadcast.md) |
| [Migrations](operations/migrations.md) | Kysely migrator, CLI, snapshots |
| [Portainer (VPS deploy)](deployment/portainer.md) | Docker UI (localhost-only); optional manual `apps` updates alongside stack-watchdog |

## Apps

| App | Entry |
|-----|-------|
| `chain-indexer` | [README](apps/chain-indexer/README.md) · [Developer guide](apps/chain-indexer/developer-guide.md) · [Spec](apps/chain-indexer/spec/overview.md) |
| `ipfs-gateway` | [README](apps/ipfs-gateway/README.md) |
| `query-api` | [README](apps/query-api/README.md) · [Spec](apps/query-api/spec/overview.md) |
| `knowledge-api` | [Spec](apps/knowledge-api/spec/overview.md) |
| `auth-api` | [Overview](apps/auth-api/overview.md) |
| `notifications` | [Overview](apps/notifications/overview.md) |
| `scheduler` | [Spec](apps/scheduler/spec/overview.md) |
| `stack-watchdog` | [Spec](apps/stack-watchdog/spec/overview.md) |
| `web` | [README](apps/web/README.md) |

## Libraries (cross-cutting)

| Doc | Description |
|-----|-------------|
| [Objects domain](spec/objects-domain.md) | ResolvedView assembly, `ObjectViewService`, repositories |
