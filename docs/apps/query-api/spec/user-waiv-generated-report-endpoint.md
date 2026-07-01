---
id: query-api-user-waiv-generated-report-endpoint
title: WAIV generated advanced report endpoints
description: "Async WAIV advanced report jobs with persisted rows, mergeRewards, and per-report exemptions."
type: spec
status: active
scope: query-api
tags: [query-api, wallet, waiv, advanced-report, generated-report]
updated_at: 2026-07-01
related:
  - docs/apps/query-api/spec/user-waiv-advanced-report-endpoint.md
parent: query-api-overview
---

# WAIV generated advanced report endpoints

Async generation for the WAIV advanced report. Rows are persisted in Postgres; the web **Generated** tab lists jobs and opens detail via `?tab=generate&reportId=…`.

Requires **`Authorization: Bearer <access_token>`** on all routes. **Owner-only** (`report.owner === JWT sub`).

## Storage

| Table | Purpose |
|-------|---------|
| `waiv_generated_reports` | Job metadata, progress, totals |
| `waiv_generated_report_rows` | Row snapshots (`row` JSONB) + per-report `checked` |

Migration: `libs/migrations/src/postgres/odl/00031_waiv_generated_reports.ts` (tables) and `00032_waiv_generated_reports_merge_fold.ts` (`merge_reward_fold` JSONB column).

Worker batch size and rows page default: **500** (`WAIV_GENERATED_REPORT_WORKER_BATCH_SIZE`, `WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE` in `@opden-data-layer/core/waiv-advanced-report`).

List scope: **owner-global** — `GET /generated-reports` returns all reports where `owner === JWT sub`, not filtered by profile URL or `profileAccount`.

## Status machine

`pending` → `in_progress` → `completed` | `failed` | `stopped`

Worker: `WaivGeneratedReportWorkerService` in query-api (`@Interval` 3s) + Redis lock `query-api:lock:waiv-generated-report:{id}`.

Max **12** concurrent `pending`/`in_progress` jobs per owner.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/query/v1/wallet/waiv/generated-reports` | Create job |
| GET | `/query/v1/wallet/waiv/generated-reports` | List owner reports |
| GET | `/query/v1/wallet/waiv/generated-reports/:id` | Status + totals |
| GET | `/query/v1/wallet/waiv/generated-reports/:id/rows` | Paginated rows |
| PATCH | `/query/v1/wallet/waiv/generated-reports/:id/rows/:operationIndex` | Toggle `checked`; recalc totals |
| POST | `/query/v1/wallet/waiv/generated-reports/:id/stop` | Stop running job; flushes pending `merge_reward_fold`, recalc totals |
| DELETE | `/query/v1/wallet/waiv/generated-reports/:id` | Delete report and rows (owner only) |

### Create body

| Field | Default | Notes |
|-------|---------|-------|
| `profileAccount` | — | Profile context |
| `filterAccounts[]` | — | Mutual-tx filter (same as live report) |
| `startDate` / `endDate` | — | Unix seconds; end must be in the past |
| `currency` | `USD` | |
| `includeSwapsAndTrades` | `false` | |
| `mergeRewards` | **`true`** | Fold consecutive author/curation/beneficiary rewards within a 30-day window |

## mergeRewards

When `true`, consecutive reward ops (`comments_*Reward`) in **timestamp-desc stream order** fold into one `merged_rewards` row until:

1. A non-reward row breaks the streak, or
2. The next reward is more than **30 days older** than the anchor (newest reward in the fold).

Pending fold state is persisted in `merge_reward_fold` between worker batches. Implementation: `libs/core/src/waiv-advanced-report/merge-waiv-reward-rows.ts`.

**Pricing:** rows are priced **before** merge, so each reward keeps its own daily WAIV/USD rate. The merged row sums the per-row `totalFiat`/`waivFiat`/`wpFiat` — it does **not** re-price the summed quantity at the anchor day's rate. This keeps merged fiat totals equal to the unmerged report (a 30-day fold spans rates that would otherwise drift).

**Multi-account note:** legacy merged a single global stream sorted across all accounts; the worker paginates **one account at a time** and flushes the fold at each account boundary. Single-account reports match legacy; multi-account totals may differ slightly from old Waivio when rewards interleave across accounts.

## Exemptions (Generated)

Per-report `checked` on `waiv_generated_report_rows` — **not** `wallet_exemptions`. Toggle via PATCH rows endpoint.

## Manual QA

| # | Scenario |
|---|----------|
| 1 | **grampo**: generate with mergeRewards OFF vs ON → **same** deposits/withdrawals (regenerate after pricing fix) |
| 2 | Stop mid-generation with merge ON → deposits include pending fold rows |
| 3 | Standard tab **grampo** → totals match expected (same-timestamp pager fix) |
| 4 | Delete, export (disabled while running), toggle checked on detail |
| 5 | Detail page (`?tab=generate&reportId=…`) shows detail only — no list table below |
| 6 | 13th concurrent job → 400 |

## Verification

```bash
pnpm nx test core --testPathPatterns=merge-waiv-reward
pnpm nx test query-api --testPathPatterns=waiv-generated-report
pnpm nx test query-api --testPathPatterns=waiv-advanced-report-pager
pnpm nx test query-api --testPathPatterns=waiv-wallet-history-pager
pnpm nx test web --testPathPatterns=load-waiv-generated-report-rows
pnpm nx run web:typecheck
pnpm check:web-i18n-utf8
```
