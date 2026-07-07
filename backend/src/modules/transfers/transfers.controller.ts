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
import { AssignTransferDto } from './dto/assign-transfer.dto';
import { VerifyQRDto } from './dto/verify-qr.dto';
import { GPSTrackingDto } from './dto/gps-tracking.dto';
import { GPSTrackingBatchDto } from './dto/gps-tracking-batch.dto';
import { CompleteTransferDto } from './dto/complete-transfer.dto';
import { CancelTransferDto } from './dto/cancel-transfer.dto';
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
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.transfersService.findOne(id, user);
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
    @Body() assignDto: AssignTransferDto,
  ) {
    return this.transfersService.assignVehicleAndDriver(
      id,
      assignDto.vehicleId,
      assignDto.driverId,
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
  startPreparation(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    return this.transfersService.startPreparation(id, user);
  }

  // El tránsito se inicia al verificar el QR en origen (POST :id/verify-qr con
  // location='origin'); no existe un endpoint start-transit separado.

  @Patch(':id/arrive-destination')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTISTA)
  arriveDestination(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    return this.transfersService.arriveDestination(id, user);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO_ALMACEN)
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() completeDto: CompleteTransferDto,
    @GetUser() user: User,
  ) {
    return this.transfersService.complete(
      id,
      user,
      completeDto.receivedQuantities,
    );
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelDto: CancelTransferDto,
    @GetUser() user: User,
  ) {
    return this.transfersService.cancel(id, cancelDto.reason, user.id);
  }

  // === VERIFICACIÓN QR ===

  @Get(':id/qr')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTISTA, UserRole.ENCARGADO_ALMACEN)
  getQRCode(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.transfersService.getQRCode(id, user);
  }

  @Post(':id/verify-qr')
  @Roles(UserRole.TRANSPORTISTA, UserRole.ENCARGADO_ALMACEN)
  verifyQR(
    @Param('id', ParseIntPipe) id: number,
    @Body() verifyDto: VerifyQRDto,
    @GetUser() user: User,
  ) {
    return this.transfersService.verifyQR(
      id,
      verifyDto.qrCode,
      verifyDto.location,
      user,
    );
  }

  // === SEGUIMIENTO GPS ===

  @Post(':id/tracking')
  @Roles(UserRole.TRANSPORTISTA)
  addGPSTracking(
    @Param('id', ParseIntPipe) id: number,
    @Body() trackingDto: GPSTrackingDto,
    @GetUser() user: User,
  ) {
    return this.transfersService.addGPSTracking(id, trackingDto, user);
  }

  @Post(':id/tracking/batch')
  @Roles(UserRole.TRANSPORTISTA)
  addGPSTrackingBatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() batchDto: GPSTrackingBatchDto,
    @GetUser() user: User,
  ) {
    return this.transfersService.addGPSTrackingBatch(id, batchDto.points, user);
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
