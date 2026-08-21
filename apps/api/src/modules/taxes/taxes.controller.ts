import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth';
import { BusinessAccessGuard } from '../businesses/access';
import type { CreateTaxInput, UpdateTaxInput } from './taxes.service';
import { TaxesService } from './taxes.service';

@Controller('businesses/:businessId/taxes')
@UseGuards(AuthGuard, BusinessAccessGuard)
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  list(@Param('businessId') businessId: string) {
    return this.taxesService.list(businessId);
  }

  @Post()
  create(
    @Param('businessId') businessId: string,
    @Body() input: CreateTaxInput,
  ) {
    return this.taxesService.createTax(businessId, input);
  }

  @Get(':taxId')
  findOne(
    @Param('businessId') businessId: string,
    @Param('taxId') taxId: string,
  ) {
    return this.taxesService.findById(businessId, taxId);
  }

  @Patch(':taxId')
  update(
    @Param('businessId') businessId: string,
    @Param('taxId') taxId: string,
    @Body() input: UpdateTaxInput,
  ) {
    return this.taxesService.updateTax(businessId, taxId, input);
  }
}
