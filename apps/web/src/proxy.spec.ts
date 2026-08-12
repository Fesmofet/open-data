/** @jest-environment node */

jest.mock('server-only', () => ({}));

const mockEnv = {
  requireAuth: true,
  publicOrigin: 'https://waiviodev.com',
};

jest.mock('@/config/env', () => ({
  env: mockEnv,
}));

jest.mock('@/shared/infrastructure/auth/refresh-session', () => ({
  refreshSessionCookiesIfNeeded: jest.fn().mockResolvedValue({ kind: 'unchanged' }),
  applyProxySessionRefreshToResponse: jest.fn(
    (response: unknown) => response,
  ),
}));

import { NextRequest } from 'next/server';

import { proxy } from './proxy';

describe('proxy requireAuth gate', () => {
  beforeEach(() => {
    mockEnv.requireAuth = true;
  });

  it('allows anonymous GET /has without redirect to sign-in', async () => {
    const request = new NextRequest('https://waiviodev.com/has');
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects anonymous GET /discover to sign-in', async () => {
    const request = new NextRequest('https://waiviodev.com/discover');
    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://waiviodev.com/sign-in');
  });
});
