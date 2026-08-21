import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth';
import { BusinessAccessGuard } from '../businesses/access';
import {
  BusinessSettingsService,
  type UpdateBusinessSettingsInput,
} from './business-settings.service';

@Controller('businesses/:businessId/settings')
@UseGuards(AuthGuard, BusinessAccessGuard)
export class BusinessSettingsController {
  constructor(private readonly settingsService: BusinessSettingsService) {}

  @Get()
  get(@Param('businessId') businessId: string) {
    return this.settingsService.getSettings(businessId);
  }

  @Patch()
  update(
    @Param('businessId') businessId: string,
    @Body() input: UpdateBusinessSettingsInput,
  ) {
    return this.settingsService.updateSettings(businessId, input);
  }
}
