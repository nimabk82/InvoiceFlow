import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth';
import { BusinessAccessGuard } from '../businesses/access';
import {
  DocumentDefaultsService,
  type UpdateDocumentDefaultsInput,
} from './document-defaults.service';

@Controller('businesses/:businessId/document-defaults')
@UseGuards(AuthGuard, BusinessAccessGuard)
export class DocumentDefaultsController {
  constructor(private readonly defaultsService: DocumentDefaultsService) {}

  @Get()
  get(@Param('businessId') businessId: string) {
    return this.defaultsService.getDefaults(businessId);
  }

  @Patch()
  update(
    @Param('businessId') businessId: string,
    @Body() input: UpdateDocumentDefaultsInput,
  ) {
    return this.defaultsService.updateDefaults(businessId, input);
  }
}
