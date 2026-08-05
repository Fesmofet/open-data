import type { EngineTokenBroadcastErrorCode } from '../../domain/engine-token-broadcast-errors';

export function engineTokenBroadcastErrorMessageKey(
  code: EngineTokenBroadcastErrorCode,
): string {
  switch (code) {
    case 'not_logged_in':
      return 'wallet_broadcast_not_logged_in';
    case 'keychain_missing':
      return 'wallet_broadcast_keychain_missing';
    case 'hiveauth_session_expired':
      return 'auth_keychain_has_broadcast_expired';
    case 'hivesigner_token_missing':
      return 'wallet_broadcast_hivesigner_token_missing';
    case 'hivesigner_sign_failed':
      return 'wallet_broadcast_hivesigner_sign_failed';
    case 'transaction_id_missing':
      return 'wallet_broadcast_transaction_id_missing';
    default:
      return 'activity_error';
  }
}
