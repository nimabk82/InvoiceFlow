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
import type {
  CreateQuoteInput,
  ListQuotesOptions,
  SendQuoteInput,
} from './quotes.service';
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

  @Post(':quoteId/send')
  send(
    @Param('businessId') businessId: string,
    @Param('quoteId') quoteId: string,
    @Body() input: SendQuoteInput,
  ) {
    return this.quotesService.sendQuote(businessId, quoteId, input);
  }

  @Post(':quoteId/accept')
  accept(
    @Param('businessId') businessId: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.quotesService.acceptQuote(businessId, quoteId);
  }

  @Post(':quoteId/decline')
  decline(
    @Param('businessId') businessId: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.quotesService.declineQuote(businessId, quoteId);
  }

  @Post(':quoteId/convert')
  convert(
    @Param('businessId') businessId: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.quotesService.convertQuote(businessId, quoteId);
  }

  @Get(':quoteId/activity')
  listActivity(
    @Param('businessId') businessId: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.quotesService.listActivity(businessId, quoteId);
  }

  @Post(':quoteId/adopt-latest-theme')
  adoptLatestTheme(
    @Param('businessId') businessId: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.quotesService.adoptLatestTheme(businessId, quoteId);
  }
}
