export const HAS_CMD = {
  CONNECTED: 'connected',
  AUTH_REQ: 'auth_req',
  AUTH_WAIT: 'auth_wait',
  AUTH_ACK: 'auth_ack',
  AUTH_NACK: 'auth_nack',
  AUTH_ERR: 'auth_err',
  SIGN_REQ: 'sign_req',
  SIGN_WAIT: 'sign_wait',
  SIGN_ACK: 'sign_ack',
  SIGN_NACK: 'sign_nack',
  SIGN_ERR: 'sign_err',
  ATTACH_REQ: 'attach_req',
  ATTACH_ACK: 'attach_ack',
  ATTACH_NACK: 'attach_nack',
  CHALLENGE_REQ: 'challenge_req',
  CHALLENGE_WAIT: 'challenge_wait',
  CHALLENGE_ACK: 'challenge_ack',
  CHALLENGE_NACK: 'challenge_nack',
  CHALLENGE_ERR: 'challenge_err',
  ERROR: 'error',
} as const;

export type HasCmd = (typeof HAS_CMD)[keyof typeof HAS_CMD];

export const HAS_SUPPORTED_PROTOCOLS = [0.8, 1] as const;
