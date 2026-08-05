'use client';

import HAS from 'hive-auth-wrapper';

import {
  buildHasWsUrlCandidates,
  normalizeHasWsUrl,
  stripHasWsUrlTrailingSlash,
} from '@/config/has.constants';

import type { HasConfig } from '@/config/has-config-provider';

import { buildHasAuthDeepLink } from './has-deep-link';
import {
  defaultHasSessionExpireMs,
  normalizeHasExpireTimestamp,
} from './has-expire';
import type { HasAuthSession } from './has-auth-session.storage';
import { toHasWrapperAuth } from './has-auth-session.storage';

export type HasAuthWaitEvent = {
  uuid: string;
  expire: number;
  account: string;
  key: string;
  deepLink: string;
};

export type HasAuthenticateResult = HasAuthSession;

let activeHasHost: string | null = null;

export function getActiveHasWsUrl(): string | null {
  return activeHasHost;
}

export async function ensureHasConnection(preferredUrl?: string): Promise<string> {
  if (preferredUrl) {
    const host = stripHasWsUrlTrailingSlash(preferredUrl);
    HAS.setOptions({ host: normalizeHasWsUrl(host) });
    const connected = await HAS.connect();
    if (connected) {
      activeHasHost = host;
      return host;
    }
    throw new Error('Failed to connect to HiveAuth server');
  }

  const candidates = buildHasWsUrlCandidates();
  for (const candidate of candidates) {
    HAS.setOptions({ host: normalizeHasWsUrl(candidate) });
    const connected = await HAS.connect();
    if (connected) {
      activeHasHost = stripHasWsUrlTrailingSlash(candidate);
      return activeHasHost;
    }
  }

  throw new Error('Failed to connect to HiveAuth server');
}

export async function authenticateWithHas(input: {
  username: string;
  challengeMessage: string;
  config: HasConfig;
  onAuthWait?: (event: HasAuthWaitEvent) => void;
}): Promise<HasAuthenticateResult> {
  const authHost = stripHasWsUrlTrailingSlash(input.config.wsUrl);
  await ensureHasConnection(authHost);

  const auth = {
    username: input.username.trim().replace(/^@/, '').toLowerCase(),
    expire: undefined as number | undefined,
    key: undefined as string | undefined,
    token: undefined as string | undefined,
  };

  const appMeta = {
    name: input.config.appName,
    description: `${input.config.appName} — Hive authentication`,
    icon: undefined as string | undefined,
  };

  const challengeData = {
    key_type: 'posting',
    challenge: input.challengeMessage,
  };

  await HAS.authenticate(auth, appMeta, challengeData, (evt: {
    uuid: string;
    expire: number;
    account: string;
    key: string;
  }) => {
    const deepLink = buildHasAuthDeepLink({
      account: evt.account,
      uuid: evt.uuid,
      key: evt.key,
      host: authHost,
    });
    input.onAuthWait?.({
      uuid: evt.uuid,
      expire: evt.expire,
      account: evt.account,
      key: evt.key,
      deepLink,
    });
  });

  if (auth.key == null || auth.expire == null) {
    throw new Error('HiveAuth authentication did not return session data');
  }

  return {
    username: auth.username,
    key: auth.key,
    expire:
      auth.expire != null
        ? normalizeHasExpireTimestamp(auth.expire)
        : defaultHasSessionExpireMs(),
    ...(typeof auth.token === 'string' ? { hasSessionToken: auth.token } : {}),
    host: authHost,
  };
}

export async function broadcastWithHas(input: {
  session: HasAuthSession;
  keyType: 'posting' | 'active';
  ops: unknown[];
  config: HasConfig;
  onSignWait?: (event: { uuid: string; expire: number }) => void;
}): Promise<unknown> {
  await ensureHasConnection(input.session.host ?? input.config.wsUrl);

  const auth = toHasWrapperAuth(input.session);

  return HAS.broadcast(auth, input.keyType, input.ops, (evt) => {
    const event = evt as { uuid: string; expire: number };
    input.onSignWait?.(event);
  });
}
