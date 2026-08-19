import {
  type ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthPrincipal } from '../../auth/authentication';
import { BusinessAccessGuard } from './business-access.guard';
import type { BusinessAccessService } from './business-access.service';

type Request = {
  account?: AuthPrincipal;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

function createContext(request: Request): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('BusinessAccessGuard', () => {
  const assertMember = jest.fn();
  const access = { assertMember } as unknown as BusinessAccessService;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects when no authenticated account is present', async () => {
    const guard = new BusinessAccessGuard(access);

    await expect(
      guard.canActivate(createContext({ params: { businessId: 'b1' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when no business id is present', async () => {
    const guard = new BusinessAccessGuard(access);

    await expect(
      guard.canActivate(createContext({ account: { accountId: 'a1' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the account is not a member', async () => {
    assertMember.mockRejectedValue(new ForbiddenException());
    const guard = new BusinessAccessGuard(access);

    await expect(
      guard.canActivate(
        createContext({
          account: { accountId: 'a1' },
          params: { businessId: 'b1' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a member for the business id in the route params', async () => {
    assertMember.mockResolvedValue(undefined);
    const guard = new BusinessAccessGuard(access);

    await expect(
      guard.canActivate(
        createContext({
          account: { accountId: 'a1' },
          params: { businessId: 'b1' },
        }),
      ),
    ).resolves.toBe(true);
    expect(assertMember).toHaveBeenCalledWith('a1', 'b1');
  });

  it('allows a member for the business id in the query string', async () => {
    assertMember.mockResolvedValue(undefined);
    const guard = new BusinessAccessGuard(access);

    await expect(
      guard.canActivate(
        createContext({
          account: { accountId: 'a1' },
          query: { businessId: 'b2' },
        }),
      ),
    ).resolves.toBe(true);
    expect(assertMember).toHaveBeenCalledWith('a1', 'b2');
  });
});
