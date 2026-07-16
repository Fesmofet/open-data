/** Context passed to every custom_json envelope action handler. */
export interface OdlEventContext {
  action: string;
  creator: string;
  blockNum: number;
  transactionIndex: number;
  operationIndex: number;
  odlEventIndex: number;
  transactionId: string;
  timestamp: string;
  eventSeq: bigint;
  eventIdIndexMap: ReadonlyMap<string, number>;
}

/** Common interface for envelope action handlers (ODL and OBL). */
export interface OdlActionHandler {
  readonly action: string;
  handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void>;
}

export interface EnvelopeEvent {
  action: string;
  v: number;
  event_id?: string;
  payload: Record<string, unknown>;
}

export interface EnvelopeShape {
  events: EnvelopeEvent[];
}

export interface EnvelopeDispatchOptions {
  schema: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: EnvelopeShape;
      error?: { message: string };
    };
  };
  handlerMap: Record<string, OdlActionHandler>;
  governanceCache: {
    resolvePlatform: () => Promise<{ banned: string[] }>;
  };
  logger: {
    warn: (msg: string) => void;
    log: (msg: string) => void;
    error: (msg: string) => void;
  };
  encodeEventSeq: (parts: {
    blockNum: number;
    trxIndex: number;
    opIndex: number;
    odlEventIndex: number;
  }) => bigint;
  hiveCtx: {
    blockNum: number;
    transactionIndex: number;
    operationIndex: number;
    transaction: { transaction_id: string };
    timestamp: string;
  };
  account: string;
  unknownActionLabel?: string;
}

export async function dispatchEnvelope(
  rawJson: string,
  options: EnvelopeDispatchOptions,
): Promise<void> {
  const {
    schema,
    handlerMap,
    governanceCache,
    logger,
    encodeEventSeq,
    hiveCtx,
    account,
    unknownActionLabel = 'unknown action',
  } = options;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    logger.warn('custom_json: failed to parse JSON');
    return;
  }

  const envelopeResult = schema.safeParse(parsed);
  if (!envelopeResult.success || !envelopeResult.data) {
    logger.warn(`envelope validation failed: ${envelopeResult.error?.message ?? 'unknown'}`);
    return;
  }

  const { events } = envelopeResult.data;

  const eventIdIndexMap = new Map<string, number>();
  for (let i = 0; i < events.length; i++) {
    const eid = events[i].event_id;
    if (eid) {
      eventIdIndexMap.set(eid, i);
    }
  }

  const gov = await governanceCache.resolvePlatform();
  if (gov.banned.includes(account)) {
    logger.log(`account '${account}' is banned; ignoring all events`);
    return;
  }

  for (let odlEventIndex = 0; odlEventIndex < events.length; odlEventIndex++) {
    const event = events[odlEventIndex];
    const handler = handlerMap[event.action];

    if (!handler) {
      logger.warn(`${unknownActionLabel} '${event.action}'; skipping`);
      continue;
    }

    const ctx: OdlEventContext = {
      action: event.action,
      creator: account,
      blockNum: hiveCtx.blockNum,
      transactionIndex: hiveCtx.transactionIndex,
      operationIndex: hiveCtx.operationIndex,
      odlEventIndex,
      transactionId: hiveCtx.transaction.transaction_id,
      timestamp: hiveCtx.timestamp,
      eventSeq: encodeEventSeq({
        blockNum: hiveCtx.blockNum,
        trxIndex: hiveCtx.transactionIndex,
        opIndex: hiveCtx.operationIndex,
        odlEventIndex,
      }),
      eventIdIndexMap,
    };

    try {
      await handler.handle(event.payload, ctx);
    } catch (err: unknown) {
      logger.error(
        `handler '${event.action}' failed at block ${hiveCtx.blockNum}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
