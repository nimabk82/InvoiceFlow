import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { QuoteStatus } from '@invoiceflow/domain';

import { AuthGuard } from '../auth';
import { BusinessAccessGuard } from '../businesses/access';
import type { CreateQuoteInput, ListQuotesOptions } from './quotes.service';
import { QuotesService } from './quotes.service';

const quoteStatuses: readonly QuoteStatus[] = [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'declined',
  'expired',
];

@Controller('businesses/:businessId/quotes')
@UseGuards(AuthGuard, BusinessAccessGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  list(
    @Param('businessId') businessId: string,
    @Query('status') status?: string,
  ) {
    const options: ListQuotesOptions = {};

    if (status && quoteStatuses.includes(status as QuoteStatus)) {
      options.status = status as QuoteStatus;
    }

    return this.quotesService.list(businessId, options);
  }

  @Post()
  create(
    @Param('businessId') businessId: string,
    @Body() input: CreateQuoteInput,
  ) {
    return this.quotesService.createQuote(businessId, input);
  }

  @Get(':quoteId')
  findOne(
    @Param('businessId') businessId: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.quotesService.findById(businessId, quoteId);
  }
}
