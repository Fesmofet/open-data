# Core library import routing

Agents and contributors: use this table before importing from `@opden-data-layer/core`.

CI enforces boundaries via `pnpm check:core-imports` (see [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml)).

## Libraries

| Package | Scope | Contains |
|---------|-------|----------|
| `@opden-data-layer/core` | `scope:domain` | Object/update registries, Hive parsers, constants, pure utils. **No Nest, no Kysely row types in barrel.** |
| `@opden-data-layer/odl-db-types` | `scope:shared` | Kysely `OdlDatabase` and PostgreSQL row types (`Post`, `ObjectUpdate`, `JsonValue`, …). Type-only surface. |

## Import cheat sheet

| Symbol / use case | Import |
|-------------------|--------|
| `UPDATE_REGISTRY`, `UPDATE_TYPES`, `OBJECT_TYPE_REGISTRY` | `@opden-data-layer/core/update-registry`, `/update-types`, `/object-type-registry` |
| `localeFromHeaders`, `DEFAULT_LOCALE` | `@opden-data-layer/core` (barrel → `http/locale-from-headers`) |
| `buildObjectChannelId`, `buildOslMessageId` | `@opden-data-layer/core/utils/osl-messaging` or core barrel |
| `computeDmPairHash` | `@opden-data-layer/core/utils/osl-messaging-crypto` (Node `crypto` — server/indexer only) |
| `detectPostingSigner` | `@opden-data-layer/core/utils/hive-tx-signer` subpath only (dhive — not in barrel) |
| `Post`, `OdlDatabase`, `JsonValue`, `ChannelMember`, … | `@opden-data-layer/odl-db-types` |
| `ReqLocale` (Nest decorator) | `apps/query-api/src/http/locale-header.decorator` |

## Web (`apps/web`)

- Barrel `@opden-data-layer/core` is safe for **Server Components** after the core split.
- **Client components (`'use client'`):** use subpaths for large registries to improve tree-shaking; do not import the core barrel unless only `import type`.
- **DB types:** `import type { … } from '@opden-data-layer/odl-db-types'` only — no runtime imports in client bundles.

## Nest apps

- Repositories and database modules: import row types from `@opden-data-layer/odl-db-types`.
- Domain logic mixed with registries: split imports — domain from `core`, DB types from `odl-db-types`.

## Verification

```bash
pnpm check:core-imports
pnpm typecheck:web
pnpm typecheck:nest
pnpm nx test core
```
