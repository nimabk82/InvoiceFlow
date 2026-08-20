import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { InvoiceStatus } from '@invoiceflow/domain';

import { AuthGuard } from '../auth';
import { BusinessAccessGuard } from '../businesses/access';
import type {
  CreateInvoiceInput,
  ListInvoicesOptions,
  RecordPaymentInput,
  SendInvoiceInput,
} from './invoices.service';
import { InvoicesService } from './invoices.service';

const invoiceStatuses: readonly InvoiceStatus[] = [
  'draft',
  'sent',
  'viewed',
  'partially_paid',
  'paid',
  'overdue',
  'void',
];

@Controller('businesses/:businessId/invoices')
@UseGuards(AuthGuard, BusinessAccessGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  list(
    @Param('businessId') businessId: string,
    @Query('status') status?: string,
  ) {
    const options: ListInvoicesOptions = {};

    if (status && invoiceStatuses.includes(status as InvoiceStatus)) {
      options.status = status as InvoiceStatus;
    }

    return this.invoicesService.list(businessId, options);
  }

  @Post()
  create(
    @Param('businessId') businessId: string,
    @Body() input: CreateInvoiceInput,
  ) {
    return this.invoicesService.createInvoice(businessId, input);
  }

  @Get(':invoiceId')
  findOne(
    @Param('businessId') businessId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.invoicesService.getInvoiceWithStatus(businessId, invoiceId);
  }

  @Post(':invoiceId/send')
  send(
    @Param('businessId') businessId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() input: SendInvoiceInput,
  ) {
    return this.invoicesService.sendInvoice(businessId, invoiceId, input);
  }

  @Post(':invoiceId/payments')
  recordPayment(
    @Param('businessId') businessId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() input: RecordPaymentInput,
  ) {
    return this.invoicesService.recordPayment(businessId, invoiceId, input);
  }

  @Get(':invoiceId/payments')
  listPayments(
    @Param('businessId') businessId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.invoicesService.listPayments(businessId, invoiceId);
  }
}
