# SVG → lucide-react icon adapter

## Checklist

- [x] Install `lucide-react` (root + `@opden-data-layer/web`)
- [x] Add `optimizePackageImports: ['lucide-react']` in `next.config.js`
- [x] Create `apps/web/src/icons` module (registry, lucide pack, custom pack, named API)
- [x] Migrate all inline SVG in modules/shared (64 files)
- [x] Delete 12 legacy icon shim files
- [x] Unit/integration tests (`icon.spec.tsx`, `registry.spec.ts`, `icons-single-source.spec.ts`, `icons-server-safe.spec.tsx`)
- [x] E2E smoke (`apps/web-e2e/src/icons-smoke.spec.ts`)
- [x] ESLint guards (no lucide-react outside packs; no inline svg in features)
- [x] Docs: `docs/apps/web/spec/icons.md`, `apps/web/AGENTS.md` Icons section

## Review

**Changes:** Introduced `@/icons` adapter over lucide-react with ~80 semantic names, custom pack for brand/colored/special glyphs, migrated 124 inline SVG usages, removed duplicate shim files.

**Verification:**
- `pnpm typecheck:web` — pass
- `pnpm nx test web --testPathPatterns=icons` — 31 tests pass
- `pnpm nx lint web` — pre-existing 7 errors (unrelated); new icon ESLint rules active, no svg/lucide violations in features
- `pnpm nx run web:verify-production-build` — pass

**Follow-up:** Manual light/dark smoke on header, feed story actions, editor toolbar, object left rail, wallet history.
