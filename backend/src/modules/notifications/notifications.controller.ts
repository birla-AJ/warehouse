import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendTestNotificationDto, ListNotificationsQueryDto } from './dto/notification.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  @Permissions({ module: 'settings', action: 'read' })
  list(@Query() query: ListNotificationsQueryDto) {
    return this.service.list(query);
  }

  @Post('test')
  @Permissions({ module: 'settings', action: 'update' })
  test(@Body() dto: SendTestNotificationDto) {
    return this.service.send({ ...dto, type: 'TEST' });
  }
}
