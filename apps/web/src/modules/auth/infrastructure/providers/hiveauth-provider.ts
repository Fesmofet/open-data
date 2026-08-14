'use client';

import { hasExpireToVerifyUnix } from './has/has-expire';

/**
 * HiveAuth login completes by sending signed challenge proof to the auth BFF verify endpoint.
 */
export function buildHiveAuthPayload(input: {
  username: string;
  expireUnix: number;
  challengeMessage: string;
  pubkey: string;
  signature: string;
}): string {
  return JSON.stringify({
    username: input.username,
    expire: input.expireUnix,
    challenge: input.challengeMessage,
    pubkey: input.pubkey,
    signature: input.signature,
  });
}

/** Build verify payload from a HAS session and signed challenge proof. */
export function buildHiveAuthVerifyPayload(input: {
  username: string;
  expireMs: number;
  challengeMessage: string;
  pubkey: string;
  signature: string;
}): string {
  return buildHiveAuthPayload({
    username: input.username,
    expireUnix: hasExpireToVerifyUnix(input.expireMs),
    challengeMessage: input.challengeMessage,
    pubkey: input.pubkey,
    signature: input.signature,
  });
}
