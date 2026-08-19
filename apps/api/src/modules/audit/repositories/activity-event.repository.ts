import type { ActivityEvent } from '@invoiceflow/domain';

export const ACTIVITY_EVENT_REPOSITORY = Symbol('ACTIVITY_EVENT_REPOSITORY');

export type ActivityEventListQuery = Readonly<{
  businessId: string;
  entityType?: ActivityEvent['entityType'];
  entityId?: string;
  cursor?: string;
  limit?: number;
}>;

export type ActivityEventPage = Readonly<{
  items: readonly ActivityEvent[];
  nextCursor?: string;
}>;

export interface ActivityEventRepository {
  record(event: ActivityEvent): Promise<void>;
  list(query: ActivityEventListQuery): Promise<ActivityEventPage>;
}
