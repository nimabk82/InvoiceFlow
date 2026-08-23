import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type {
  ClaimedEmail,
  EmailOutboxRepository,
} from './email-outbox.repository';

type EmailOutboxRow = {
  id: string;
  command_key: string;
  claim_token: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string;
  text_body: string | null;
};

type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      claim_email_outbox: {
        Args: { p_outbox_id: string | null };
        Returns: EmailOutboxRow[];
      };
      mark_email_outbox_accepted: {
        Args: {
          p_outbox_id: string;
          p_claim_token: string;
          p_provider_name: string;
          p_provider_message_id: string | null;
        };
        Returns: boolean;
      };
      mark_email_outbox_failed: {
        Args: {
          p_outbox_id: string;
          p_claim_token: string;
          p_provider_name: string;
          p_error: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

@Injectable()
export class SupabaseEmailOutboxRepository implements EmailOutboxRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async claim(outboxId?: string): Promise<ClaimedEmail | null> {
    const { data, error } = await this.client.rpc('claim_email_outbox', {
      p_outbox_id: outboxId ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    const row = data[0];
    if (!row?.claim_token) {
      return null;
    }

    return {
      id: row.id,
      commandKey: row.command_key,
      claimToken: row.claim_token,
      to: row.to_addresses,
      cc: row.cc_addresses,
      bcc: row.bcc_addresses,
      subject: row.subject,
      text: row.text_body ?? undefined,
    };
  }

  async markAccepted(
    outboxId: string,
    claimToken: string,
    providerName: string,
    providerMessageId?: string,
  ): Promise<boolean> {
    const { data, error } = await this.client.rpc(
      'mark_email_outbox_accepted',
      {
        p_outbox_id: outboxId,
        p_claim_token: claimToken,
        p_provider_name: providerName,
        p_provider_message_id: providerMessageId ?? null,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async markFailed(
    outboxId: string,
    claimToken: string,
    providerName: string,
    failure: string,
  ): Promise<boolean> {
    const { data, error } = await this.client.rpc('mark_email_outbox_failed', {
      p_outbox_id: outboxId,
      p_claim_token: claimToken,
      p_provider_name: providerName,
      p_error: failure,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
