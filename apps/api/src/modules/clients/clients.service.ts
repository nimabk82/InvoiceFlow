import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Client } from '@invoiceflow/domain';

import {
  CLIENT_REPOSITORY,
  type ClientPage,
  type ClientRepository,
} from './repositories/client.repository';

export type ListClientsOptions = {
  search?: string;
  includeArchived?: boolean;
  limit?: number;
};

export type CreateClientInput = {
  name?: string;
  company?: string;
  emails?: { address: string; isPrimary?: boolean }[];
  phone?: string;
  taxNumber?: string;
  internalNote?: string;
};

@Injectable()
export class ClientsService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async list(
    businessId: string,
    options?: ListClientsOptions,
  ): Promise<ClientPage> {
    return this.clientRepository.list({ businessId, ...options });
  }

  async createClient(
    businessId: string,
    input: CreateClientInput,
  ): Promise<Client> {
    const name = input.name?.trim();
    const company = input.company?.trim();

    if (!name && !company) {
      throw new BadRequestException('Provide a client name or company');
    }

    const client: Client = {
      id: randomUUID(),
      businessId,
      name: name || undefined,
      company: company || undefined,
      emails: (input.emails ?? []).map((email, index) => ({
        id: randomUUID(),
        address: email.address.trim(),
        isPrimary: email.isPrimary ?? index === 0,
      })),
      phone: input.phone?.trim() || undefined,
      taxNumber: input.taxNumber?.trim() || undefined,
      internalNote: input.internalNote?.trim() || undefined,
    };

    await this.clientRepository.save(client);

    return client;
  }
}
