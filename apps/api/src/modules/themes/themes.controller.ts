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
  CreateThemeFromPresetInput,
  UpdateThemeInput,
} from './themes.service';
import { ThemesService } from './themes.service';

@Controller('businesses/:businessId/themes')
@UseGuards(AuthGuard, BusinessAccessGuard)
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get()
  list(
    @Param('businessId') businessId: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.themesService.list(businessId, includeArchived === 'true');
  }

  @Post()
  create(
    @Param('businessId') businessId: string,
    @Body() input: CreateThemeFromPresetInput,
  ) {
    return this.themesService.createFromPreset(businessId, input);
  }

  @Get(':themeId')
  get(
    @Param('businessId') businessId: string,
    @Param('themeId') themeId: string,
  ) {
    return this.themesService.get(businessId, themeId);
  }

  @Get(':themeId/versions/:versionId')
  getHistoricalVersion(
    @Param('businessId') businessId: string,
    @Param('themeId') themeId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.themesService.getHistoricalVersion(
      businessId,
      themeId,
      versionId,
    );
  }

  @Get(':themeId/version-state/:frozenVersionId')
  getVersionState(
    @Param('businessId') businessId: string,
    @Param('themeId') themeId: string,
    @Param('frozenVersionId') frozenVersionId: string,
  ) {
    return this.themesService.getVersionState(
      businessId,
      themeId,
      frozenVersionId || undefined,
    );
  }

  @Patch(':themeId')
  update(
    @Param('businessId') businessId: string,
    @Param('themeId') themeId: string,
    @Body() input: UpdateThemeInput,
  ) {
    return this.themesService.update(businessId, themeId, input);
  }

  @Post(':themeId/duplicate')
  duplicate(
    @Param('businessId') businessId: string,
    @Param('themeId') themeId: string,
  ) {
    return this.themesService.duplicate(businessId, themeId);
  }

  @Post(':themeId/archive')
  archive(
    @Param('businessId') businessId: string,
    @Param('themeId') themeId: string,
  ) {
    return this.themesService.archive(businessId, themeId);
  }

  @Post(':themeId/restore')
  restore(
    @Param('businessId') businessId: string,
    @Param('themeId') themeId: string,
  ) {
    return this.themesService.restore(businessId, themeId);
  }

  @Post(':themeId/versions')
  saveConfig(
    @Param('businessId') businessId: string,
    @Param('themeId') themeId: string,
    @Body() config: Record<string, unknown>,
  ) {
    return this.themesService.saveConfig(businessId, themeId, config);
  }
}
