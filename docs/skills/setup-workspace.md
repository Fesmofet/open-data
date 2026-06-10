---
title: Setup agent workspace
type: skill
status: active
scope: platform
tags: [agent, workspace, git, clone, onboarding, github]
updated_at: 2026-06-10
related:
  - docs/README.md
  - docs/getting-started.md
  - docs/apps/knowledge-api/spec/overview.md
  - docs/standards/docs-standards.md
---

# Setup agent workspace

## When to use

- An agent reads specs via **knowledge-api** (`search_knowledge`, `get_file`) but must open **source code** referenced as repo paths (e.g. `apps/web/src/...`).
- The agent has shell access and can install Git / clone a repository.
- You are onboarding a **sidecar agent** (not already inside a checkout of this monorepo).

## When not to use

- The agent already runs with the repo as workspace root — use local paths directly.
- You only need markdown specs — knowledge-api is enough; no clone required.
- The environment has **no shell** (MCP-only, no git) — use [GitHub fetch fallback](#github-fetch-fallback-no-clone) instead.

## Repository

| Item | Value |
|------|--------|
| URL | https://github.com/Waiviogit/open-data-layer |
| Default branch | `master` (production CI base); `staging` for pre-production work |
| Layout | Nx monorepo; app code under `apps/`, libs under `libs/`, docs under `docs/` |

## Path contract

All **Related code paths** and inline paths in specs are **relative to the repository root**.

| Spec says | Local file (after clone) |
|-----------|---------------------------|
| `apps/web/src/app/layout.tsx` | `<workspace>/apps/web/src/app/layout.tsx` |
| `libs/core/src/index.ts` | `<workspace>/libs/core/src/index.ts` |

Relative markdown links like `../../../../apps/web/...` in spec files point at the same paths; they only resolve inside a checkout or on GitHub.

## Steps — full workspace (recommended)

### 1. Install Git

**Windows:** [https://git-scm.com/download/win](https://git-scm.com/download/win) — use Git Bash or PowerShell after install.

**macOS:** `xcode-select --install` or `brew install git`.

**Linux:** distro package, e.g. `apt install git` / `dnf install git`.

Verify:

```bash
git --version
```

### 2. Clone

```bash
git clone https://github.com/Waiviogit/open-data-layer.git
cd open-data-layer
```

For staging-aligned work:

```bash
git clone --branch staging https://github.com/Waiviogit/open-data-layer.git
cd open-data-layer
```

### 3. Optional — run stack locally

Only if the task requires build/test, not for read-only code exploration:

```bash
pnpm install
```

See [getting-started.md](../getting-started.md) for Docker, migrations, and app commands.

### 4. Optional — knowledge-api MCP

To query indexed docs while coding:

1. Configure Postgres + run migrations (see [knowledge-api overview](../apps/knowledge-api/spec/overview.md)).
2. `pnpm knowledge:reindex`
3. `pnpm nx serve knowledge-api`
4. Point MCP client at `http://localhost:7400/knowledge/mcp`

Specs remain the source of truth for behavior; source files implement it.

## GitHub fetch fallback (no clone)

When the agent **cannot** clone but **can** HTTP-fetch URLs, resolve any repo-root path `<path>` and branch `<ref>` (usually `master`):

| Purpose | URL pattern |
|---------|-------------|
| Browse (human/agent UI) | `https://github.com/Waiviogit/open-data-layer/blob/<ref>/<path>` |
| Raw file content | `https://raw.githubusercontent.com/Waiviogit/open-data-layer/<ref>/<path>` |

Examples:

- `apps/web/src/modules/user-profile/presentation/components/user-menu.tsx`
  - Blob: https://github.com/Waiviogit/open-data-layer/blob/master/apps/web/src/modules/user-profile/presentation/components/user-menu.tsx
  - Raw: https://raw.githubusercontent.com/Waiviogit/open-data-layer/master/apps/web/src/modules/user-profile/presentation/components/user-menu.tsx

Use the **same branch** as the spec revision you are implementing (`master` vs `staging`).

## Verification

**After clone:**

```bash
git rev-parse --show-toplevel
test -f apps/web/src/app/layout.tsx && echo OK
```

**After raw fetch:** response is TypeScript/markdown source, not HTML error page.

## Related

- [Documentation index](../README.md)
- [Getting started](../getting-started.md) — full dev environment
- [Knowledge-api](../apps/knowledge-api/spec/overview.md) — MCP tools for specs
- [Web page specs](../apps/web/spec/pages/index.md) — route/site map for frontend rebuild
