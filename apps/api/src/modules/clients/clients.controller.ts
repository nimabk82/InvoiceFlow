import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth';
import { BusinessAccessGuard } from '../businesses/access';
import type { ListClientsOptions } from './clients.service';
import { ClientsService } from './clients.service';

@Controller('businesses/:businessId/clients')
@UseGuards(AuthGuard, BusinessAccessGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  list(
    @Param('businessId') businessId: string,
    @Query('search') search?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const options: ListClientsOptions = { search };

    if (includeArchived === 'true') {
      options.includeArchived = true;
    }

    return this.clientsService.list(businessId, options);
  }
}
