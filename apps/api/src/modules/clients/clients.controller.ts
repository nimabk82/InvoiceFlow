import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth';
import { BusinessAccessGuard } from '../businesses/access';
import type {
  CreateClientInput,
  ListClientsOptions,
  UpdateClientInput,
} from './clients.service';
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

  @Post()
  create(
    @Param('businessId') businessId: string,
    @Body() input: CreateClientInput,
  ) {
    return this.clientsService.createClient(businessId, input);
  }

  @Get(':clientId')
  findOne(
    @Param('businessId') businessId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.clientsService.findById(businessId, clientId);
  }

  @Patch(':clientId')
  update(
    @Param('businessId') businessId: string,
    @Param('clientId') clientId: string,
    @Body() input: UpdateClientInput,
  ) {
    return this.clientsService.updateClient(businessId, clientId, input);
  }
}
