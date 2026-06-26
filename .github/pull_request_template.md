## Summary

<!-- 1–3 bullet points: what changed and why -->

## Test plan

- [ ] Unit tests pass (`pnpm nx affected -t test`)
- [ ] Manual QA (see feature spec if applicable)

## Breaking changes

<!-- Remove this section if none. -->

### WAIV advanced report exemptions

**Breaking (WAIV exemptions only):** `operationIndex` was recalculated using stable `tieId` disambiguation (rewards and same-tx transfers). Exemptions saved before this deploy on the WAIV table no longer apply. Users must re-toggle rows they want excluded. Hive table exemptions are unaffected. Orphan rows in `wallet_exemptions` are not deleted.

See [user-waiv-advanced-report-endpoint.md](../docs/apps/query-api/spec/user-waiv-advanced-report-endpoint.md#breaking-change-this-release).
