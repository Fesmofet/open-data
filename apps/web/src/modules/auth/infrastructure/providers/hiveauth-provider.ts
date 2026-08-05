'use client';

import { hasExpireToVerifyUnix } from './has/has-expire';

/**
 * HiveAuth login completes by sending `authData` JSON to the auth BFF verify endpoint.
 */
export function buildHiveAuthPayload(input: {
  username: string;
  expireUnix: number;
  challengeMessage?: string;
}): string {
  return JSON.stringify({
    username: input.username,
    expire: input.expireUnix,
    ...(input.challengeMessage !== undefined
      ? { challenge: input.challengeMessage }
      : {}),
  });
}

/** Build verify payload from a HAS session (expire in milliseconds). */
export function buildHiveAuthVerifyPayload(input: {
  username: string;
  expireMs: number;
  challengeMessage: string;
}): string {
  return buildHiveAuthPayload({
    username: input.username,
    expireUnix: hasExpireToVerifyUnix(input.expireMs),
    challengeMessage: input.challengeMessage,
  });
}
