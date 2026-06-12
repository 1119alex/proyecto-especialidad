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
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../entities/user.entity';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  create(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.create(createWarehouseDto);
  }

  @Get()
  findAll() {
    return this.warehousesService.findAll();
  }

  @Get('managers/available')
  getAvailableManagers() {
    return this.warehousesService.getAvailableManagers();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(id, updateWarehouseDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.remove(id);
  }

  // ===== INVENTARIO =====

  @Get(':id/inventory')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO_ALMACEN)
  getInventory(@Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.getInventory(id);
  }

  @Patch(':id/inventory')
  @Roles(UserRole.ADMIN)
  adjustInventory(
    @Param('id', ParseIntPipe) id: number,
    @Body() adjustInventoryDto: AdjustInventoryDto,
    @GetUser() user: User,
  ) {
    return this.warehousesService.adjustInventory(
      id,
      adjustInventoryDto,
      user.id,
    );
  }
}
