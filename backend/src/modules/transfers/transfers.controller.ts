import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../entities/user.entity';

@Controller('transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Body() createTransferDto: CreateTransferDto,
    @GetUser() user: User,
  ) {
    return this.transfersService.create(createTransferDto, user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.transfersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTISTA, UserRole.ENCARGADO_ALMACEN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transfersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransferDto: UpdateTransferDto,
  ) {
    return this.transfersService.update(id, updateTransferDto);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN)
  assignVehicleAndDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { vehicleId: number; driverId: number },
  ) {
    return this.transfersService.assignVehicleAndDriver(
      id,
      body.vehicleId,
      body.driverId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transfersService.remove(id);
  }
}
