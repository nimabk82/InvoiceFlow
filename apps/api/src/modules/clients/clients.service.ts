import { Inject, Injectable } from '@nestjs/common';

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
}
