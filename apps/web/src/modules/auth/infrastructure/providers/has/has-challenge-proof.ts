export type HasChallengeProof = {
  pubkey: string;
  signature: string;
};

type HasChallengeAckData = {
  pubkey?: unknown;
  challenge?: unknown;
};

/** Extract `{ pubkey, signature }` from auth_ack or challenge_ack decrypted payload. */
export function extractChallengeProofFromAckData(
  data: unknown,
): HasChallengeProof | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const source =
    'challenge_data' in data &&
    data.challenge_data &&
    typeof data.challenge_data === 'object'
      ? data.challenge_data
      : data;

  const record = source as HasChallengeAckData;
  const pubkey =
    typeof record.pubkey === 'string' ? record.pubkey.trim() : '';
  const signature =
    typeof record.challenge === 'string' ? record.challenge.trim() : '';

  if (!pubkey || !signature) {
    return undefined;
  }

  return { pubkey, signature };
}

export function extractChallengeProofFromAuthAck(
  authAck: unknown,
): HasChallengeProof | undefined {
  if (!authAck || typeof authAck !== 'object' || !('data' in authAck)) {
    return undefined;
  }

  return extractChallengeProofFromAckData(
    (authAck as { data: unknown }).data,
  );
}
