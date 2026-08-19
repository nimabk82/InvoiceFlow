import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { AuthGuard, type AuthenticatedRequest } from './auth.guard';
import type { Authentication } from './authentication';

function createContext(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  const authentication: Authentication = { verify: jest.fn() };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('attaches the account for a valid bearer token', async () => {
    (authentication.verify as jest.Mock).mockResolvedValue({
      accountId: 'account-1',
      email: 'a@b.c',
    });
    const request: AuthenticatedRequest = {
      headers: { authorization: 'Bearer abc' },
    };
    const guard = new AuthGuard(authentication);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.account).toEqual({ accountId: 'account-1', email: 'a@b.c' });
  });

  it('rejects when no authorization header is present', async () => {
    const request: AuthenticatedRequest = { headers: {} };
    const guard = new AuthGuard(authentication);

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when the token is not a bearer token', async () => {
    const request: AuthenticatedRequest = {
      headers: { authorization: 'Basic abc' },
    };
    const guard = new AuthGuard(authentication);

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when token verification fails', async () => {
    (authentication.verify as jest.Mock).mockResolvedValue(null);
    const request: AuthenticatedRequest = {
      headers: { authorization: 'Bearer abc' },
    };
    const guard = new AuthGuard(authentication);

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
