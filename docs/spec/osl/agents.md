---
id: docs-spec-osl-agents
title: OSL agent accounts
description: Agent Hive accounts use direct and group channels (no kind=agent).
type: spec
status: active
scope: platform
tags: [osl, messaging, agents]
---

# Agent accounts

No separate `kind=agent`. Agent Hive accounts use:

| Scenario | Channel |
|----------|---------|
| User ↔ agent 1:1 | `direct` (canonical `pair_hash`) |
| Multi-party with agents | `group` |
| Object-tied signals | `object` channel (+ optional `group`) |

AI context: normal messages + `message_context_exclude`.
