import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AuthGuard, CurrentAccount, type AuthPrincipal } from '../auth';
import type { CreateBusinessInput } from './businesses.service';
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
}
