import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../../entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@GetUser() user: User) {
    return this.notificationsService.findForUser(user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('fcm-token')
  @HttpCode(204)
  async registerFcmToken(
    @Body() dto: RegisterFcmTokenDto,
    @GetUser() user: User,
  ) {
    await this.notificationsService.registerFcmToken(user.id, dto.token);
  }
}
