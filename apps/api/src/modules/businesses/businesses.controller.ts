import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard, CurrentAccount, type AuthPrincipal } from '../auth';
import { BusinessAccessGuard } from './access';
import type {
  CreateBusinessInput,
  UpdateBusinessInput,
} from './businesses.service';
import { BusinessesService } from './businesses.service';

@Controller('businesses')
@UseGuards(AuthGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  create(
    @Body() input: CreateBusinessInput,
    @CurrentAccount() account: AuthPrincipal,
  ) {
    return this.businessesService.createBusiness(account.accountId, input);
  }

  @Get()
  list(@CurrentAccount() account: AuthPrincipal) {
    return this.businessesService.listForAccount(account.accountId);
  }

  @Get(':businessId')
  @UseGuards(BusinessAccessGuard)
  findOne(@Param('businessId') businessId: string) {
    return this.businessesService.findById(businessId);
  }

  @Patch(':businessId')
  @UseGuards(BusinessAccessGuard)
  update(
    @Param('businessId') businessId: string,
    @Body() input: UpdateBusinessInput,
  ) {
    return this.businessesService.updateBusiness(businessId, input);
  }
}
