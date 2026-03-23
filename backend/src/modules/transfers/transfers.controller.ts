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
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTISTA, UserRole.ENCARGADO_ALMACEN)
  findAll(@GetUser() user: User) {
    return this.transfersService.findAll(user);
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

  // === GESTIÓN DE ESTADOS ===

  @Patch(':id/start-preparation')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO_ALMACEN)
  startPreparation(@Param('id', ParseIntPipe) id: number) {
    return this.transfersService.startPreparation(id);
  }

  @Patch(':id/start-transit')
  @Roles(UserRole.TRANSPORTISTA, UserRole.ENCARGADO_ALMACEN)
  startTransit(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.transfersService.startTransit(id, user.id);
  }

  @Patch(':id/arrive-destination')
  @Roles(UserRole.TRANSPORTISTA)
  arriveDestination(@Param('id', ParseIntPipe) id: number) {
    return this.transfersService.arriveDestination(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ENCARGADO_ALMACEN)
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { receivedQuantities?: { productId: number; quantity: number }[] },
  ) {
    return this.transfersService.complete(id, body.receivedQuantities);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @GetUser() user: User,
  ) {
    return this.transfersService.cancel(id, body.reason, user.id);
  }

  // === VERIFICACIÓN QR ===

  @Get(':id/qr')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTISTA, UserRole.ENCARGADO_ALMACEN)
  getQRCode(@Param('id', ParseIntPipe) id: number) {
    return this.transfersService.getQRCode(id);
  }

  @Post(':id/verify-qr')
  @Roles(UserRole.TRANSPORTISTA, UserRole.ENCARGADO_ALMACEN)
  verifyQR(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { qrCode: string; location: 'origin' | 'destination' },
    @GetUser() user: User,
  ) {
    return this.transfersService.verifyQR(id, body.qrCode, body.location, user.id);
  }

  // === SEGUIMIENTO GPS ===

  @Post(':id/tracking')
  @Roles(UserRole.TRANSPORTISTA)
  addGPSTracking(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { latitude: number; longitude: number; speed?: number; accuracy?: number },
  ) {
    return this.transfersService.addGPSTracking(id, body);
  }

  @Get(':id/tracking')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTISTA, UserRole.ENCARGADO_ALMACEN)
  getTrackingHistory(@Param('id', ParseIntPipe) id: number) {
    return this.transfersService.getTrackingHistory(id);
  }

  @Get(':id/tracking/latest')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTISTA, UserRole.ENCARGADO_ALMACEN)
  getLatestTracking(@Param('id', ParseIntPipe) id: number) {
    return this.transfersService.getLatestTracking(id);
  }
}
