---
id: docs-apps-scheduler-spec-overview
title: Scheduler app
description: Background cron worker with Redis locks and Postgres job queue for scheduled tasks.
type: overview
status: active
scope: scheduler
tags: [scheduler, overview]
updated_at: 2026-06-10
related:
  - docs/README.md
---

# Scheduler app (`apps/scheduler`)

Background Nest process with **no HTTP server**: it registers **cron** schedules, acquires a short **Redis lock** to enqueue work once across replicas, stores **run metadata** and a **Postgres job queue**, and a **worker** loop claims rows with `FOR UPDATE SKIP LOCKED` and runs job handlers (timeouts, retries, overlap policy).

## Configuration

- Shared Postgres (`POSTGRES_*`) and Redis (`REDIS_URI`) with other ODL services.
- `SCHEDULER_WORKER_INTERVAL_MS` — how often the worker polls the queue.
- `SCHEDULER_WORKER_BATCH_SIZE` — max items claimed per round.
- `SCHEDULER_GLOBAL_ENABLED` — if `false`, scheduled cron dispatches are skipped (manual CLI still enqueues if the job is not disabled).
- `SCHEDULER_DISABLED_JOBS` — comma-separated job names, temporarily off without deploy.
- `SCHEDULER_ENQUEUE_LOCK_TOKEN_TTL_SEC` — upper bound (with job `lockTtlSec`) for the Redis `SET NX` used only while inserting run + queue rows.
- `SCHEDULER_STALE_CLAIM_SEC` / `SCHEDULER_STALE_RUN_SEC` — worker reclaims queue rows stuck in `claimed` after a crash and fails ancient incomplete runs that would block `allowOverlap: false` forever.
- Post rewards: `HIVE_ENGINE_HISTORY_NODES` (History API for finalize), `POST_REWARDS_FINALIZE_DELAY_SEC`, batch sizes — see [`post-rewards.md`](post-rewards.md) and `apps/scheduler/.env.example`.

## Flow

1. **Cron** (or **manual** CLI) calls dispatch for a `CronJobDefinition` by name.
2. **Distributed enqueue lock** (`trySetNx`) so only one replica inserts for that tick.
3. **DB**: insert `scheduler_job_runs` + `scheduler_job_queue` in one transaction.
4. **Worker** claims pending rows, sets run to `running`, runs the handler with `AbortSignal` + timeout, writes success/fail and duration; retries requeue with `available_at` delay until `max_attempts`.

## Idempotency

Run rows record attempts; **business idempotence** is the responsibility of each `run()` handler. Handlers should tolerate restarts, duplicate ticks, and overlap scenarios where that is still allowed.

## Manual run

Build then:

```text
node dist/apps/scheduler/main.js --run-job=<name> --payload='{"from":"2026-01-01"}'
```

Cron and the worker **interval** are not registered when `--run-job` is present; the process enqueues, drains the queue, and exits.

## Migrations

Tables `scheduler_job_runs` and `scheduler_job_queue` are in `libs/migrations` (ODL). Apply with the root `migrate` script after deploy.

## Feature specs

| Spec | Summary |
|------|---------|
| [Post rewards](post-rewards.md) | WAIV reconcile + post-cashout finalize (Redis queues from chain-indexer) |
| [Post expertise](post-expertise.md) | Author expertise at finalize + backfill job |

## Related code

- Job registry: `apps/scheduler/src/jobs/jobs.registry.ts`
- Types: `apps/scheduler/src/jobs/cron-job.types.ts`
- Shared Redis client extensions: `trySetNx` / `releaseLockIfValue` in `@opden-data-layer/clients`
