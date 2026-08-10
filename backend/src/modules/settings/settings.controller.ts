import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpsertSettingDto } from './dto/setting.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get()
  @Permissions({ module: 'settings', action: 'read' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user.organizationId);
  }

  @Get(':key')
  @Permissions({ module: 'settings', action: 'read' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('key') key: string) {
    return this.service.get(user.organizationId, key);
  }

  @Patch(':key')
  @Permissions({ module: 'settings', action: 'update' })
  upsert(@CurrentUser() user: AuthenticatedUser, @Param('key') key: string, @Body() dto: UpsertSettingDto) {
    return this.service.upsert(user.organizationId, key, dto.value);
  }
}
