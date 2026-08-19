import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_CLIENT } from '../../infrastructure/supabase/supabase-client.token';
import type { AuthPrincipal, Authentication } from './authentication';

@Injectable()
export class SupabaseAuthentication implements Authentication {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
  ) {}

  async verify(token: string): Promise<AuthPrincipal | null> {
    const { data, error } = await this.client.auth.getUser(token);

    if (error || !data?.user) {
      return null;
    }

    return {
      accountId: data.user.id,
      email: data.user.email ?? undefined,
    };
  }
}
