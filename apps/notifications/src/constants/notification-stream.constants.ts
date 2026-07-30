/** Must match chain-indexer publisher stream key */
export const NOTIFICATION_STREAM_KEY = 'chain-indexer:notifications:stream';

export const NOTIFICATION_STREAM_DATA_FIELD = 'data';

export const NOTIFICATION_CONSUMER_GROUP = 'notifications-consumers';

export const NOTIFICATION_STREAM_BATCH_SIZE = 100;

/** Attempts for the whole batch before acking it to avoid blocking the stream. */
export const NOTIFICATION_ROUTE_MAX_ATTEMPTS = 2;

export const NOTIFICATION_LOG_EVERY_N_EVENTS = 500;
