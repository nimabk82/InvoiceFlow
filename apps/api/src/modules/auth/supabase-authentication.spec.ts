import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseAuthentication } from './supabase-authentication';

function createClient(getUser: jest.Mock): SupabaseClient {
  return { auth: { getUser } } as unknown as SupabaseClient;
}

describe('SupabaseAuthentication', () => {
  const token = 'test-token';

  it('resolves the principal from a valid token', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'account-1', email: 'a@b.c' } },
      error: null,
    });
    const authentication = new SupabaseAuthentication(createClient(getUser));

    await expect(authentication.verify(token)).resolves.toEqual({
      accountId: 'account-1',
      email: 'a@b.c',
    });
    expect(getUser).toHaveBeenCalledWith(token);
  });

  it('returns null when the token is rejected', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: new Error('invalid token'),
    });
    const authentication = new SupabaseAuthentication(createClient(getUser));

    await expect(authentication.verify(token)).resolves.toBeNull();
  });

  it('returns null when no user is present', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const authentication = new SupabaseAuthentication(createClient(getUser));

    await expect(authentication.verify(token)).resolves.toBeNull();
  });
});
