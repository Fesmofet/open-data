/** Hive requires delegating at least ~1 HIVE worth of vesting shares. */
export const HIVE_MIN_DELEGATION_HP = 1;

/** Minimum RC the delegator must keep on account (~account creation fee in RC units). */
export const HIVE_RC_DELEGATOR_RESERVE = 3_000_000_000;

/** Maximum delegatees per single delegate_rc operation. */
export const HIVE_RC_MAX_DELEGATEES_PER_OP = 100;
