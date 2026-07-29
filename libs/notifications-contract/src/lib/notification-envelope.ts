/** Shared fields on every notification integration event. */
export interface NotificationEnvelope {
  /** ISO 8601 */
  readonly occurredAt: string;
  readonly blockNum: number;
  readonly trxId: string | null;
  readonly objectId: string | null;
  /** Hive account that performed the action */
  readonly actor: string | null;
}
