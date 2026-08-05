import {
  defaultHasSessionExpireMs,
  normalizeHasExpireTimestamp,
} from './has-expire';

/**
 * Credential layers (do not conflate):
 *
 * | Layer              | Storage                         | Used for                    |
 * |--------------------|---------------------------------|-----------------------------|
 * | App JWT            | httpOnly `odl_access`/`refresh` | Server auth, BFF, query-api |
 * | HAS signing session| `odl_hiveauth_session`          | HAS.authenticate/broadcast  |
 * | HiveSigner OAuth   | `odl_hs_token`                  | HiveSigner SDK              |
 *
 * JWT access token ≠ HAS hasSessionToken. Verify payload never includes key or hasSessionToken.
 */

/** Legacy Waivio Cookie `auth` shape after HAS auth_ack. */
export type HasAuthSession = {
  username: string;
  /** Session encryption key (`auth_key`) shared with Keychain during HAS login. */
  key: string;
  /** Expiration timestamp in milliseconds (legacy Cookie `auth.expire`). */
  expire: number;
  /** HAS session token from auth_ack (sent on sign_req; required by Keychain PKSA). */
  hasSessionToken?: string;
  /** HAS server the PKSA paired with during login. */
  host?: string;
};

export const ODL_HIVEAUTH_SESSION_KEY = 'odl_hiveauth_session';

let memoryHasAuthSession: HasAuthSession | null = null;

function readHasSessionToken(parsed: Partial<HasAuthSession> & { token?: string }): string | undefined {
  if (typeof parsed.hasSessionToken === 'string') {
    return parsed.hasSessionToken;
  }
  if (typeof parsed.token === 'string') {
    return parsed.token;
  }
  return undefined;
}

function parseStoredSession(raw: string): HasAuthSession | null {
  const parsed = JSON.parse(raw) as Partial<HasAuthSession> & { token?: string };
  if (typeof parsed.username !== 'string' || typeof parsed.key !== 'string') {
    return null;
  }
  const hasSessionToken = readHasSessionToken(parsed);
  return {
    username: parsed.username,
    key: parsed.key,
    expire:
      typeof parsed.expire === 'number'
        ? normalizeHasExpireTimestamp(parsed.expire)
        : defaultHasSessionExpireMs(),
    ...(hasSessionToken ? { hasSessionToken } : {}),
    ...(typeof parsed.host === 'string' ? { host: parsed.host } : {}),
  };
}

function isSessionExpired(session: HasAuthSession): boolean {
  return session.expire <= Date.now();
}

export function saveHasAuthSession(session: HasAuthSession): void {
  memoryHasAuthSession = session;
  const payload = JSON.stringify(session);
  let persisted = false;
  try {
    localStorage.setItem(ODL_HIVEAUTH_SESSION_KEY, payload);
    persisted = true;
  } catch {
    // ignore quota / private mode
  }
  try {
    sessionStorage.setItem(ODL_HIVEAUTH_SESSION_KEY, payload);
    persisted = true;
  } catch {
    // ignore quota / private mode
  }
  if (!persisted) {
    throw new Error('Could not save HiveAuth session. Disable private browsing or allow site storage.');
  }
}

function loadHasAuthSession(): HasAuthSession | null {
  if (memoryHasAuthSession) {
    return memoryHasAuthSession;
  }

  for (const storage of [localStorage, sessionStorage]) {
    try {
      const raw = storage.getItem(ODL_HIVEAUTH_SESSION_KEY);
      if (!raw) {
        continue;
      }
      const session = parseStoredSession(raw);
      if (session) {
        memoryHasAuthSession = session;
        return session;
      }
    } catch {
      // ignore parse / storage errors
    }
  }

  return null;
}

export function getHasAuthSession(): HasAuthSession | null {
  const session = loadHasAuthSession();
  if (session && isSessionExpired(session)) {
    clearHasAuthSession();
    return null;
  }
  return session;
}

export function requireHasAuthSession(): HasAuthSession {
  const session = loadHasAuthSession();
  if (!isHasAuthSessionUsable(session)) {
    clearHasAuthSession();
    throw new Error(HIVEAUTH_SESSION_MISSING_MESSAGE);
  }
  if (!isHasAuthSessionValid(session)) {
    clearHasAuthSession();
    throw new Error(HIVEAUTH_SESSION_EXPIRED_MESSAGE);
  }
  return session;
}

export function clearHasAuthSession(): void {
  memoryHasAuthSession = null;
  try {
    localStorage.removeItem(ODL_HIVEAUTH_SESSION_KEY);
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem(ODL_HIVEAUTH_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function isHasAuthSessionValid(
  session: HasAuthSession | null,
): session is HasAuthSession {
  return isHasAuthSessionUsable(session) && session.expire > Date.now();
}

/** True when username + auth_key exist (legacy Cookie `auth` equivalent). */
export function isHasAuthSessionUsable(
  session: HasAuthSession | null,
): session is HasAuthSession {
  if (!session) {
    return false;
  }
  return session.username.length > 0 && session.key.length > 0;
}

/** Map stored session to hive-auth-wrapper auth object (legacy Cookie `auth`). */
export function toHasWrapperAuth(session: HasAuthSession): {
  username: string;
  expire: number;
  key: string;
  token?: string;
} {
  return {
    username: session.username,
    expire: session.expire,
    key: session.key,
    ...(session.hasSessionToken ? { token: session.hasSessionToken } : {}),
  };
}

export const HIVEAUTH_SESSION_MISSING_MESSAGE =
  'HiveAuth session missing. Sign in again via Keychain.';
export const HIVEAUTH_SESSION_EXPIRED_MESSAGE =
  'HiveAuth session expired. Sign in again via Keychain.';