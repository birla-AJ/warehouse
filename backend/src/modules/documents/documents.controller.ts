import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { RegisterDocumentDto, ListDocumentsQueryDto, PresignUploadDto } from './dto/document.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private service: DocumentsService) {}

  @Post('upload-url')
  @Permissions({ module: 'settings', action: 'create' })
  getUploadUrl(@Body() dto: PresignUploadDto) {
    return this.service.getUploadUrl(dto);
  }

  @Post('upload')
  @Permissions({ module: 'settings', action: 'create' })
  register(@Body() dto: RegisterDocumentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.register(dto, user.id);
  }

  @Get()
  @Permissions({ module: 'settings', action: 'read' })
  list(@Query() query: ListDocumentsQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions({ module: 'settings', action: 'read' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }
}
