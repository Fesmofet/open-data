# Governance Resolution

**Back:** [Spec index](README.md) · **Related:** [architecture](architecture.md), [governance-bootstrap](governance-bootstrap.md), [vote-semantics](vote-semantics.md), [authority-entity](authority-entity.md), [social-account-ingestion](social-account-ingestion.md)

## 1) Purpose

Define how Query/Masking Service constructs an effective governance snapshot from a governance object indexed on-chain.

A governance object is a regular object in `objects_core` with `objectType = 'governance'`. Its updates follow the same multi-cardinality write and vote semantics as all other objects.

## 2) Governance update types

Most update types are **multi-cardinality** (accumulate, never replace). `objectControl` is **single-cardinality** — only one active value at a time. No length restriction on value lists.

| `updateType`     | Cardinality | Value format | Meaning |
|------------------|-------------|--------------|---------|
| `admins`         | multi  | text — Hive account name | Account granted admin role in this governance context |
| `trusted`        | multi  | text — Hive account name | Account granted trusted role in this governance context |
| `validityCutoff` | multi  | JSON — `{ account: string, timestamp: number }` | Actions by this account after `timestamp` (unix) are untrusted; historical work remains valid |
| `restricted`      | multi  | text — Hive account name | Account flagged for reward eligibility (informational only, not enforced in V2) |
| `whitelist`      | multi  | text — Hive account name | Account protected from appearing in the resolved `muted` set regardless of who muted them |
| `inheritsFrom`   | multi  | JSON — `{ objectId: string, scope: GovernanceScope[] }` | Merge specific fields from the referenced governance object into this one (one level only) |
| `authority`      | multi  | text — Hive account name | Restricts object search scope to objects where at least one `authority` account holds an `object_authority` record |
| `objectControl`  | single | text — `ObjectControlMode` enum value | Activates global object authority control for this governance context |

```typescript
// Valid scope field names — any key from the output snapshot except 'objectControl' and 'inheritsFrom'.
type GovernanceScope = 'admins' | 'trusted' | 'validityCutoff' | 'restricted' | 'whitelist' | 'authority' | 'muted';
```

## 3) Write rules

- Only the governance object `creator` may submit updates (`update_create`) to a governance object.
- At the indexer level, all events are stored as neutral state.
- At query layer, updates whose `update.creator` ≠ governance object `creator` are excluded before resolution.
- Only the creator's own validity votes (`for` / `against`) are considered when resolving governance update entries. Admin, trusted, and curator filter mechanics do not apply to governance objects.

## 4) Snapshot construction

The resolved governance snapshot is computed at request time in five steps.

### Step 1: Resolve own update lists

For each update type, include only entries where `update.creator == governance.creator`. An entry is valid if the creator voted `for` it (or no vote exists, defaulting to valid); it is excluded if the creator voted `against` it.

- `admins` → resolved set of account strings
- `trusted` → resolved set of account strings
- `validityCutoff` → resolved list of `{ account: string, timestamp: number }`
- `restricted` → resolved set of account strings
- `whitelist` → resolved set of account strings
- `inheritsFrom` → resolved list of `{ objectId: string, scope: GovernanceScope[] }`
- `authority` → resolved set of account strings
- `objectControl` → resolved single `ObjectControlMode` string, or `null` if absent / voted against

### Step 2: Resolve inherited fields

For each entry in `inheritsFrom`:

- Load the referenced governance object from `objects_core` (must have `objectType = 'governance'`).
- Resolve **only** the fields listed in `entry.scope` from that object, using the same creator-vote resolution as Step 1.
- **Do not** follow `inheritsFrom` entries of the referenced object — one level only.
- For `muted` in scope: compute the referenced governance's `muted` set (aggregate mutes of its resolved `admins ∪ trusted`, without applying its own `whitelist`).

### Step 3: Merge by scope

For each field named in any `inheritsFrom` entry's `scope`, union the inherited values into the own set:

```
field = own field ∪ inherited field  (union, deduplicated)
```

Fields not listed in any `scope` are not inherited — they come from the root governance object only. `objectControl` and `inheritsFrom` are never merged regardless of scope.

### Step 4: Aggregate muted accounts

For every account in `admins ∪ trusted` (merged set from step 3):

- Load their active mutes from `social_mutes_current` (`WHERE muter = account`).
- Union all results, plus any `muted` values carried in from step 3, into a single `muted` set.

### Step 5: Apply whitelist filter

Remove every account that appears in `whitelist` from the aggregated `muted` set.

Whitelisted accounts are never present in the resolved `muted` set, regardless of who muted them.

### Output snapshot

```typescript
// Extensible enum — only 'full' is defined in V2; future modes may be added.
type ObjectControlMode = 'full';

type GovernanceScope = 'admins' | 'trusted' | 'validityCutoff' | 'restricted' | 'whitelist' | 'authority' | 'muted';

interface InheritsFromEntry {
  objectId: string;
  scope:    GovernanceScope[];
}

{
  admins:         string[];
  trusted:        string[];
  validityCutoff: { account: string; timestamp: number }[];
  restricted:      string[];
  whitelist:      string[];
  inheritsFrom:   InheritsFromEntry[];
  authority:      string[];
  objectControl:  ObjectControlMode | null;  // null = control off
  muted:          string[];
}
```

## 5) validityCutoff semantics

`validityCutoff` entries describe accounts whose **new** actions became untrusted after a given point in time.

- Actions by `account` with `block_time < timestamp` remain valid under normal vote semantics.
- Actions by `account` with `block_time >= timestamp` are excluded from trusted resolution (treated as if the account is not in the `trusted` set for those actions).
- Historical valid work (votes, updates) created before the cutoff is not retroactively invalidated.

Use case: a trusted account was compromised at a known date. The cutoff preserves the historical contribution while discarding post-compromise actions.

## 6) authority filter semantics

When the resolved `authority` set is non-empty, it acts as a **search scope restriction** applied before any other query filters.

Query execution with a non-empty `authority`:

1. Look up `object_authority` for all entries where `username ∈ authority` (any `authorityType`, any `targetKind = 'object'`).
2. Collect the resulting set of `targetId` values — these are the **eligible object IDs**.
3. Restrict the object search to only those eligible IDs. Objects not present in the eligible set are excluded from results entirely, regardless of other filters.

When `authority` is empty, no scope restriction is applied — all objects are candidates.

Use case: a governance context scoped to a specific curator's catalogue — only objects that curator has explicitly claimed authority over are visible in search results for that governance.

## 7) objectControl semantics

`objectControl` sets a global authority mode for all objects in the governance context.

### Modes

| Value    | Behaviour |
|----------|-----------|
| `null`   | Control off (default). The curator filter from [authority-entity.md](authority-entity.md) applies only to objects that have explicit `object_authority` records. Objects without authority records use normal vote semantics. |
| `'full'` | All objects behave as if they have active ownership authority. The curator filter applies to **every** object in the context, regardless of whether explicit `object_authority` records exist. Governance `admins` act as the implicit ownership authority across all objects. |

In `'full'` mode the effective curator set for any object is:

```
C = { governance admins } ∪ { explicit ownership holders from object_authority }
```

### Future modes

`ObjectControlMode` is an extensible string enum. Additional modes may be defined in future iterations without breaking the snapshot structure. Unrecognised mode values must be treated as `null` (control off) by the query layer.

## 8) Role domains

Data domain:

- `admins`
- `trusted`

Social domain:

- `moderator`

Role effects are domain-scoped and must not leak across domains.

## 9) Caching and invalidation

### Cache key

At minimum:

- governance object `objectId`,
- `objects_core.seq` of the governance object at resolution time,
- index checkpoint / `resolved_at_block`.

### Invalidation triggers

- Any update to the governance object (`objects_core.seq` increases),
- Any validity vote change on a governance update,
- Any update to a governance object referenced in `inheritsFrom` (`objects_core.seq` of the inherited object increases),
- Mute graph change for any account in `admins ∪ trusted` (including inherited),
- TTL expiry.

## 10) Governance ownership constraint

- Governance object updates are valid only when authored by the governance object `creator`.
- Any non-creator update attempt must fail with `UNAUTHORIZED_GOVERNANCE_OP` at the indexer level (or be filtered at query layer).

## 11) Determinism and observability

- Same indexed state and same governance `objectId` must produce the same snapshot hash.
- Resolution logs should include: cache hit/miss, resolved_at_block, elapsed time.

## 12) Optional trust signals (non-authoritative)

The following signals may inform auxiliary ranking or freshness scoring but must not replace authoritative governance rules:

- profile → website linkage with reciprocal `llm.txt` account proof,
- subscription/payment signal,
- account heartbeat/activity recency.

These signals are advisory and must be clearly separated from decisive role resolution.
