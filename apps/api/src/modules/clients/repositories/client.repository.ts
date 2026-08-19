import type { Client } from '@invoiceflow/domain';

export const CLIENT_REPOSITORY = Symbol('CLIENT_REPOSITORY');

export type ClientListQuery = Readonly<{
  businessId: string;
  search?: string;
  includeArchived?: boolean;
  cursor?: string;
  limit?: number;
}>;

export type ClientPage = Readonly<{
  items: readonly Client[];
  nextCursor?: string;
}>;

export interface ClientRepository {
  findById(id: string, businessId: string): Promise<Client | null>;
  list(query: ClientListQuery): Promise<ClientPage>;
  save(client: Client): Promise<void>;
}
