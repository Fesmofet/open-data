import { HIVESIGNER_REDIRECT_INITIATED } from '@/modules/auth/infrastructure/signers/hivesigner-signer';

export { HIVESIGNER_REDIRECT_INITIATED };

export type EngineTokenBroadcastErrorCode =
  | 'broadcast_failed'
  | 'not_logged_in'
  | 'keychain_missing'
  | 'hiveauth_session_expired'
  | 'hivesigner_token_missing'
  | 'hivesigner_sign_failed'
  | 'transaction_id_missing';

export function mapEngineTokenBroadcastError(error: unknown): EngineTokenBroadcastErrorCode {
  if (!(error instanceof Error)) {
    return 'broadcast_failed';
  }
  const message = error.message;
  if (message === HIVESIGNER_REDIRECT_INITIATED) {
    return 'broadcast_failed';
  }
  if (message === 'Not logged in') {
    return 'not_logged_in';
  }
  if (message.includes('Keychain extension not found')) {
    return 'keychain_missing';
  }
  if (
    message.includes('HiveAuth session expired') ||
    message.includes('HiveAuth session missing') ||
    message.includes('connected through HAS')
  ) {
    return 'hiveauth_session_expired';
  }
  if (message.includes('HiveSigner access token missing')) {
    return 'hivesigner_token_missing';
  }
  if (message.includes('HiveSigner sign URL failed')) {
    return 'hivesigner_sign_failed';
  }
  if (message.includes('transaction id missing')) {
    return 'transaction_id_missing';
  }
  return 'broadcast_failed';
}

export function isHiveSignerRedirectError(error: unknown): boolean {
  return error instanceof Error && error.message === HIVESIGNER_REDIRECT_INITIATED;
}
