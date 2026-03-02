# Services Architecture (V2)

## 1) Overview

V2 is split into two independent services:

- `Indexer Service` (write path, blockchain ingestion)
- `Query/Masking Service` (read path, governance policy application)

This split is mandatory for scalability and deterministic governance masking.

## 2) Indexer Service responsibilities

- Read blockchain events in canonical order.
- Validate payload and write-path business invariants.
- Persist:
  - canonical event log,
  - neutral materialized state,
  - governance declarations as regular objects (`object_type = governance`, as data, not final filtering result).
  - `object_type` registry entities (`name`, `supported_updates`, `supposed_updates`).
- Expose neutral read contract for query service.

Indexer does not apply tenant/request governance filtering.
Indexer does validate `update_create` against `object_type.supported_updates`.

## 3) Query/Masking Service responsibilities

- Receive API requests with governance context.
- Resolve effective governance set (global + request scope).
- Apply mask and precedence rules.
- Return filtered/ranked data to client.
- Maintain governance resolution cache with deterministic invalidation.

## 4) Service contract

### Indexer -> Query data contract

Minimum required datasets:

- objects state
- updates state and vote aggregates
- governance declarations (`object_type = governance`) and role/trust edges
- object type registry state (`object_type` entity set)
- event metadata required for deterministic tie-breaks

### Query input contract

Each query must include:

- resource/filter parameters,
- governance context (governance id/profile or explicit policy ref),
- optional pagination/sort controls.

## 5) Determinism rules

- Indexer determinism: same event stream => same neutral state.
- Query determinism: same neutral state + same governance input => same response.
- Cross-service versioning must prevent mixed interpretation of governance schema versions.

## 6) Failure domains

- Indexer failure must not corrupt query governance cache; query can continue on last consistent snapshot.
- Query failure must not affect indexer ingestion.
- Retries and partial failures must preserve idempotence guarantees.
