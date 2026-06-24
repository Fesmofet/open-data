import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { ViewerMatchesJwtGuard } from './viewer-matches-jwt.guard';

function mockContext(
  body: Record<string, unknown>,
  user?: { sub: string },
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ body, user }),
    }),
  } as ExecutionContext;
}

describe('ViewerMatchesJwtGuard', () => {
  const guard = new ViewerMatchesJwtGuard();

  it('allows when viewer is omitted', () => {
    expect(guard.canActivate(mockContext({}, { sub: 'alice' }))).toBe(true);
  });

  it('allows when viewer matches token subject (case-insensitive)', () => {
    expect(
      guard.canActivate(mockContext({ viewer: 'Alice' }, { sub: 'alice' })),
    ).toBe(true);
  });

  it('forbids when viewer does not match token subject', () => {
    expect(() =>
      guard.canActivate(mockContext({ viewer: 'bob' }, { sub: 'alice' })),
    ).toThrow(ForbiddenException);
  });

  it('forbids when viewer is set but user is missing', () => {
    expect(() => guard.canActivate(mockContext({ viewer: 'alice' }))).toThrow(
      ForbiddenException,
    );
  });
});
