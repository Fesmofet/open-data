---
id: web-pages-user-profile-routes-engine-wallet-history
title: Hive Engine wallet transaction history
description: Row mapping rules for the ENGINE wallet tab on transfers.
type: spec
status: active
scope: web
tags: [web, page, user-profile, wallet, hive-engine]
updated_at: 2026-07-06
related:
  - docs/apps/web/spec/pages/user-profile/routes/transfers.md
  - docs/apps/query-api/spec/user-engine-wallet-endpoint.md
---

# Hive Engine wallet transaction history

**Back:** [transfers route](transfers.md) · **API:** [user-engine-wallet-endpoint.md](../../../../query-api/spec/user-engine-wallet-endpoint.md)

## Data flow

`POST /api/users/{name}/wallet/engine/history` (BFF) → `POST /query/v1/users/{name}/wallet/engine/history` → merged RPC + PG swap + deposit instruction rows → `buildWaivWalletHistoryPageViews` → `WaivWalletHistoryRow`.

WAIV-specific **RPC** rows are excluded at the API layer: History API `excludeSymbols` is sent for legacy parity but **not honored** by public history nodes — query-api filters WAIV server-side during RPC collection. **PG swaps are not filtered** (WAIV↔SWAP.* pool swaps remain visible).

## Row mapping

Uses the same operation → kind → label rules as [waiv-wallet-history.md](waiv-wallet-history.md), including **`deposit_instruction`** rows from `hive_engine_deposit_records` (non-WAIV deposit pairs on the ENGINE tab). There is **no** “Show author and curators rewards” toggle on the ENGINE tab (reward ops are omitted from the RPC ops filter).

## Client behavior

- Initial history load is client-side after the summary RSC prefetch.
- Infinite scroll via `useInfiniteScroll` + `useSyncedPaginatedList`.
- Empty state: `empty_transaction_list`.
- History loads independently when the summary API is unavailable (degraded mode).
