# Acceptance test cases (V2)

These cases validate both services:

- Indexer Service (deterministic neutral state)
- Query/Masking Service (governance mask behavior per request)

Canonical event order is:
`(block_num, trx_index, op_index, transaction_id)`.

---

## A) Indexer Service: object and update semantics

### AC-I1: First object_create wins
- **Setup**: Empty state.
- **Events**: Two `object_create` with same `object_id`, A first then B.
- **Expect**: A is stored; B rejected with `OBJECT_ALREADY_EXISTS`.

### AC-I2: object_create retry remains rejected
- **Setup**: Object already exists.
- **Events**: Repeat `object_create` for same `object_id`.
- **Expect**: Rejected with `OBJECT_ALREADY_EXISTS`; no state mutation.

### AC-I3: Revote replaces previous vote
- **Setup**: Update U exists, voter V has valid role.
- **Events**: `update_vote` +1, then `update_vote` -1 by same voter.
- **Expect**: Single active vote for `(U, V)`; weight adjusted by delta only.

### AC-I4: Missing role rejects vote
- **Setup**: Update U exists, voter has no role.
- **Events**: `update_vote` by voter.
- **Expect**: Rejected with `ROLE_REQUIRED`.

### AC-I5: Full reindex determinism
- **Setup**: Mixed stream with duplicates and revotes.
- **Action**: Reindex same stream twice from empty state.
- **Expect**: Same neutral state and same reject log hash.

### AC-I6: Governance object is creator-owned for updates
- **Setup**: Governance object G created by account A (`object_type = governance`).
- **Events**: `update_create` targeting G from account B.
- **Expect**: Rejected with `UNAUTHORIZED_GOVERNANCE_OP`.

### AC-I7: Governance update vote is creator-owned
- **Setup**: Governance object G created by A; governance update U exists on G.
- **Events**: `update_vote` on U from B.
- **Expect**: Rejected with `UNAUTHORIZED_GOVERNANCE_OP`.

### AC-I8: LWW for single field from same creator
- **Setup**: Object O exists; field `name` is single-value semantics.
- **Events**: Creator A publishes update U1 for `name`, then newer update U2 for `name`.
- **Expect**: Current state keeps only U2 as A's active contribution for `name`; U1 is removed from current base view for that key scope.

### AC-I9: Only main governance can create object_type
- **Setup**: Main governance creator is A.
- **Events**: Account B attempts to create object_type `product`.
- **Expect**: Rejected with `UNAUTHORIZED_OBJECT_TYPE_OP`.

### AC-I10: Main governance creates valid object_type
- **Setup**: Main governance creator is A.
- **Events**: A creates object_type `product` with `supported_updates` and `supposed_updates`.
- **Expect**: object_type entity is stored and available for subsequent update validation.

### AC-I11: Unsupported update type is rejected by indexer
- **Setup**: Object O has object_type `product`; `supported_updates = [price_update]`.
- **Events**: `update_create` for O with `update_type = nutrition_update`.
- **Expect**: Rejected with `UNSUPPORTED_UPDATE_TYPE`.

### AC-I12: supposed_updates are metadata only
- **Setup**: object_type `product` has `supposed_updates = [auto_price_sync]`, but no automation engine configured.
- **Action**: Index and query normal object/update flow.
- **Expect**: Indexer behavior is unchanged by `supposed_updates`; values are stored/exposed as metadata only.

---

## B) Query/Masking Service: governance behavior

### AC-Q1: Same indexed state, different governance, different output
- **Setup**: Indexed neutral state contains entries from multiple creators.
- **Action**: Query once with governance G1, once with governance G2.
- **Expect**: Responses differ according to mask policies; indexed state unchanged.

### AC-Q2: Same indexed state, same governance, identical output
- **Setup**: Fixed neutral state and governance input.
- **Action**: Repeat identical query multiple times.
- **Expect**: Same response payload/order each run.

### AC-Q3: Global policy precedence
- **Setup**: Global policy blocks creator C; request governance would allow C.
- **Action**: Query with that request governance.
- **Expect**: C remains filtered; no bypass of global policy.

### AC-Q4: Governance reference missing
- **Setup**: Request references unknown governance id/profile.
- **Action**: Query.
- **Expect**: Error code `GOVERNANCE_NOT_FOUND`.

### AC-Q5: Governance resolution cycle/depth protection
- **Setup**: Governance graph contains cycle or exceeds configured trust depth.
- **Action**: Query.
- **Expect**: Error code `GOVERNANCE_RESOLUTION_FAILED`.

### AC-Q6: Cache invalidation on governance update
- **Setup**: Query result cached for governance G.
- **Action**: Apply governance event that changes role/trust in G, then query again.
- **Expect**: Cache invalidated; new response reflects updated governance.

---

## C) Overflow behavior (publishing path)

### AC-OF1: Large import triggers overflow path
- **Setup**: Import size exceeds configured Hive-only threshold.
- **Action**: Run publisher.
- **Expect**: Overflow strategy selects Arweave path per policy.

### AC-OF2: Queue backlog triggers overflow drain
- **Setup**: Queue depth and age exceed overflow thresholds.
- **Action**: Run publisher scheduling cycle.
- **Expect**: Backlog batch is offloaded to Arweave according to policy limits.

### AC-OF3: Accepted vs finalized tracking
- **Setup**: Transaction accepted but not yet finalized.
- **Action**: Poll status until TTL/confirmation boundary.
- **Expect**: State transitions are deterministic (`accepted` -> `confirmed` or retry/fail branch).
