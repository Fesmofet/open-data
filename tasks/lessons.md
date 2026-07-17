## Web: client imports and `@/modules/user-social` barrel

**Pattern:** Importing the public `user-social` barrel from a **client** component can pull **server-only** modules (`query-api.client` → `env`) and break the Next.js build.

**Rule:** From client code, import **`SortDropdown`** (and similar pure UI) via **deep path**  
`@/modules/user-social/presentation/components/sort-dropdown` instead of the module barrel.

## Web: `@opden-data-layer/core` barrel in App Router

**Pattern:** Importing `@opden-data-layer/core` in a Server Component can pull **`libs/core` HTTP/Nest** code and fail Turbopack (`class-validator`, etc.).

**Rule:** For **registry-only** data in web, use scoped TS paths added to `apps/web/tsconfig.json` (and `tsconfig.base.json`):  
`@opden-data-layer/core/object-type-registry`, `@opden-data-layer/core/update-registry`, `@opden-data-layer/core/update-types` (constants only — avoids pulling `http`/Nest into client bundles).

## Web: Leaflet must not load on the server at module evaluation

**Pattern:** `MapProvider` defaulted to `leafletMapProvider` built from `leaflet/index.ts` that **statically imported** `leaflet-map.tsx` → the `leaflet` package touches **`window` at import time** → frequent `ReferenceError: window is not defined` in Turbopack/SSR logs when `@/modules/map` is part of the graph (e.g. object updates geo cards).

**Rule:** Build `leafletMapProvider` with **lazy** map/marker/popup components that `require()` Leaflet modules only on **first client render**, not when the provider module loads.

## Web: `@/modules/object-updates` barrel in client components

**Pattern:** The module `index.ts` re-exports `getObjectUpdatesFeedPageQuery` → **`query-api.client`** (`server-only`). Importing `@/modules/object-updates` from a **`'use client'`** file breaks the Next.js build.

**Rule:** From client code, import **`ObjectUpdatesFeed`** from  
`@/modules/object-updates/presentation/components/object-updates-feed` and **`ObjectEmbeddedUpdatesFeedModel`** from  
`@/modules/object-updates/embedded-updates-feed.model`. Keep using the barrel from **Server Components** only (`page.tsx`, server actions).

## query-api: recency cursor + numeric fields from pg

**Pattern:** `created_at_unix` (or offsets) may round-trip through JSON as **strings**. Strict `z.number()` in `decodeUpdatesCursor` fails → cursor is dropped → every “load more” repeats the **first page** → broken global order and “infinite” pagination.

**Rule:** Use **`z.coerce.number().int()`** in cursor payloads; **`Number()` / `Math.trunc`** when encoding and before keyset `WHERE`. If encoding fails, return **`hasMore: false`** so the client stops. Optionally **dedupe by `update_id`** when appending on the client.

## TypeScript 6: paths without baseUrl

**Pattern:** Removing `baseUrl` without rewriting `paths` to `./…` relative entries → `TS5090` and Nx graph plugin parse failures.

**Rule:** Every `paths` value must start with `./` or `../` relative to the tsconfig that owns it. Prefer Node/`Write` for JSON (no UTF-8 BOM); PowerShell `Set-Content`/`ConvertTo-Json` can inject BOM and break Nx.

## TypeScript 6 + ts-jest

**Pattern:** ts-jest ≤29.4.9 forces `moduleResolution: node10` on the CJS path → `TS5107` under TypeScript 6 even when specs say `bundler`.

**Rule:** Use **ts-jest ≥29.4.11**, keep `moduleResolution: "bundler"` in `tsconfig.spec.json`, and do **not** rely on `ignoreDeprecations`.

## webpack-cli 7

**Pattern:** Nest `project.json` still passing `--node-env=production` fails after Nx migrate bumps webpack-cli to 7.

**Rule:** Use `--config-node-env=production` / `development` instead.

## Nest `strict: true`

**Pattern:** Under full `strict`, Nest `useFactory (...args: unknown[])` fails `strictFunctionTypes` against Nest’s factory typing; Jest `mockResolvedValue(null)` fails when the mocked method is typed `T | undefined`.

**Rule:** Use `useFactory (...args: any[])` at Nest factory boundaries; in specs use `undefined` (or widen the mock) to match the declared return, and `as unknown as T` for partial fixtures. Keep strict on Nest apps + `clients` only — do not flip `tsconfig.base.json` until other consumers are ready. Gate with `pnpm typecheck:nest` (webpack build alone is not enough).

## Nx Next: plain `next.config.js`

**Pattern:** `composePlugins()` / `withNx()` from `@nx/next` are deprecated (removed in Nx v24).

**Rule:** Export a plain Next config (`module.exports = nextConfig`); drop `@nx/next` import and `nx: {}`. Workspace libs transpile without `withNx`.

## Tailwind safelist + variants

**Pattern:** Safelist regex like `/^sm:grid-cols-[1-6]$/` warns and matches nothing — patterns only match **base** utilities.

**Rule:** Use `{ pattern: /^grid-cols-[1-6]$/, variants: ['sm', 'md', 'lg', 'xl'] }` for responsive dynamic classes (e.g. `buildCardGridClassName`).

## Nest webpack: Critical dependency / broken vendor source maps

**Pattern:** Nest/Express/Kysely/`load-esm` dynamic `require` → webpack `Critical dependency` warnings; MCP SDK / iterare → `source-map-loader` ENOENT in development. Not runtime bugs for this repo.

**Rule:** Silence via shared `nestIgnoreWarnings` in `apps/nest-webpack.shared.js` (scoped to `node_modules` + source-map parse failures). Wire `ignoreWarnings: nestIgnoreWarnings` in each Nest `webpack.config.js`. Do not externalize packages just to quiet warnings.
