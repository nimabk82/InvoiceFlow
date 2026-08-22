import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

export type UpdateClientInput = CreateClientInput;

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

  async findById(businessId: string, clientId: string): Promise<Client | null> {
    return this.clientRepository.findById(clientId, businessId);
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

  async updateClient(
    businessId: string,
    clientId: string,
    input: UpdateClientInput,
  ): Promise<Client> {
    const existing = await this.clientRepository.findById(clientId, businessId);

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const updated: Client = {
      ...existing,
      name:
        input.name !== undefined
          ? input.name.trim() || undefined
          : existing.name,
      company:
        input.company !== undefined
          ? input.company.trim() || undefined
          : existing.company,
      phone:
        input.phone !== undefined
          ? input.phone.trim() || undefined
          : existing.phone,
      taxNumber:
        input.taxNumber !== undefined
          ? input.taxNumber.trim() || undefined
          : existing.taxNumber,
      internalNote:
        input.internalNote !== undefined
          ? input.internalNote.trim() || undefined
          : existing.internalNote,
      emails: input.emails
        ? input.emails.map((email, index) => ({
            id: randomUUID(),
            address: email.address.trim(),
            isPrimary: email.isPrimary ?? index === 0,
          }))
        : existing.emails,
    };

    await this.clientRepository.save(updated);

    return updated;
  }

  async archiveClient(businessId: string, clientId: string): Promise<Client> {
    const existing = await this.clientRepository.findById(clientId, businessId);

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const archived: Client = {
      ...existing,
      archivedAt: new Date().toISOString(),
    };

    await this.clientRepository.save(archived);

    return archived;
  }

  async restoreClient(businessId: string, clientId: string): Promise<Client> {
    const existing = await this.clientRepository.findById(clientId, businessId);

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const restored: Client = {
      ...existing,
      archivedAt: undefined,
    };

    await this.clientRepository.save(restored);

    return restored;
  }
}
