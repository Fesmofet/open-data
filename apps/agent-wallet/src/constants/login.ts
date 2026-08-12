/**
 * A pending login is reused instead of burning a fresh HAS auth_req when it
 * still has at least this much time left. Repeated has_login_start calls are a
 * normal agent behaviour and must not invalidate the link already sent to chat.
 */
export const LOGIN_REUSE_MIN_REMAINING_MS = 10_000;
