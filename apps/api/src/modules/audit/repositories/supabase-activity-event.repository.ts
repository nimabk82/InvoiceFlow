import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityEvent } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type {
  ActivityEventPage,
  ActivityEventRepository,
} from './activity-event.repository';

type ActivityEventRow = {
  id: string;
  business_id: string;
  entity_type: 'invoice' | 'quote';
  entity_id: string;
  type: ActivityEvent['type'];
  occurred_at: string;
  metadata: Record<string, unknown> | null;
};

type Database = {
  public: {
    Tables: {
      activity_events: {
        Row: ActivityEventRow;
        Insert: ActivityEventRow;
        Update: Partial<ActivityEventRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

@Injectable()
export class SupabaseActivityEventRepository implements ActivityEventRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async record(event: ActivityEvent): Promise<void> {
    const { error } = await this.client.from('activity_events').insert({
      id: event.id,
      business_id: event.businessId,
      entity_type: event.entityType,
      entity_id: event.entityId,
      type: event.type,
      occurred_at: event.occurredAt,
      metadata: event.metadata ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async list(query: {
    businessId: string;
    entityType?: ActivityEvent['entityType'];
    entityId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ActivityEventPage> {
    const limit = query.limit ?? 50;
    let builder = this.client
      .from('activity_events')
      .select('*')
      .eq('business_id', query.businessId)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (query.entityType) {
      builder = builder.eq('entity_type', query.entityType);
    }
    if (query.entityId) {
      builder = builder.eq('entity_id', query.entityId);
    }

    const { data, error } = await builder;

    if (error) {
      throw new Error(error.message);
    }

    return { items: (data ?? []).map(mapRow) };
  }
}

function mapRow(row: ActivityEventRow): ActivityEvent {
  return {
    id: row.id,
    businessId: row.business_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    type: row.type,
    occurredAt: row.occurred_at,
    metadata: row.metadata ?? undefined,
  };
}
