import {
  extractChallengeProofFromAckData,
  extractChallengeProofFromAuthAck,
} from './has-challenge-proof';

describe('has-challenge-proof', () => {
  it('reads challenge_data from auth_ack payload', () => {
    const proof = extractChallengeProofFromAuthAck({
      data: {
        expire: 1_735_689_600,
        challenge_data: {
          pubkey: 'STM8Ni9xY4P9YB7yWyeb5ktLi5jsRYmP3mRp7XU7kxtrN8CXFs',
          challenge: '28fe1234',
        },
      },
    });

    expect(proof).toEqual({
      pubkey: 'STM8Ni9xY4P9YB7yWyeb5ktLi5jsRYmP3mRp7XU7kxtrN8CXFs',
      signature: '28fe1234',
    });
  });

  it('reads flat challenge_ack payload', () => {
    const proof = extractChallengeProofFromAckData({
      pubkey: 'STM8TEST',
      challenge: 'SIG',
    });

    expect(proof).toEqual({ pubkey: 'STM8TEST', signature: 'SIG' });
  });

  it('returns undefined when proof fields are missing', () => {
    expect(extractChallengeProofFromAuthAck({ data: { expire: 123 } })).toBeUndefined();
    expect(extractChallengeProofFromAckData({ pubkey: 'STM8' })).toBeUndefined();
  });
});
