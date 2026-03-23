import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { Product } from '../entities/product.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Transfer } from '../entities/transfer.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { TransferStatus } from '../common/enums/transfer-status.enum';

/**
 * Script de seed para poblar la base de datos con datos de prueba
 * Ejecutar con: npm run seed
 */

export async function seed(dataSource: DataSource) {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userRepository = queryRunner.manager.getRepository(User);
    const warehouseRepository = queryRunner.manager.getRepository(Warehouse);
    const productRepository = queryRunner.manager.getRepository(Product);
    const vehicleRepository = queryRunner.manager.getRepository(Vehicle);
    const transferRepository = queryRunner.manager.getRepository(Transfer);

    // Limpiar tablas existentes
    console.log('🗑️  Limpiando tablas...');
    await queryRunner.query('TRUNCATE TABLE "transfer" CASCADE');
    await queryRunner.query('TRUNCATE TABLE "vehicle" CASCADE');
    await queryRunner.query('TRUNCATE TABLE "product" CASCADE');
    await queryRunner.query('TRUNCATE TABLE "warehouse" CASCADE');
    await queryRunner.query('TRUNCATE TABLE "user" CASCADE');

    // ========================================
    // 1. USUARIOS
    // ========================================
    console.log('👥 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = userRepository.create({
      email: 'admin@system.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: UserRole.ADMIN,
      phone: '+591 70000000',
    });

    const encargadoViacha = userRepository.create({
      email: 'cristian@viacha.com',
      passwordHash: hashedPassword,
      firstName: 'Cristian',
      lastName: 'Pérez',
      role: UserRole.ENCARGADO_ALMACEN,
      phone: '+591 70111111',
    });

    const encargadoLima = userRepository.create({
      email: 'juan@lima.com',
      passwordHash: hashedPassword,
      firstName: 'Juan',
      lastName: 'González',
      role: UserRole.ENCARGADO_ALMACEN,
      phone: '+591 70222222',
    });

    const transportista1 = userRepository.create({
      email: 'maria@transport.com',
      passwordHash: hashedPassword,
      firstName: 'María',
      lastName: 'Rodríguez',
      role: UserRole.TRANSPORTISTA,
      phone: '+591 70333333',
    });

    const transportista2 = userRepository.create({
      email: 'carlos@transport.com',
      passwordHash: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Mamani',
      role: UserRole.TRANSPORTISTA,
      phone: '+591 70444444',
    });

    await userRepository.save([
      admin,
      encargadoViacha,
      encargadoLima,
      transportista1,
      transportista2,
    ]);
    console.log('✅ Usuarios creados\n');

    // ========================================
    // 2. ALMACENES
    // ========================================
    console.log('🏢 Creando almacenes...');
    const almacenViacha = warehouseRepository.create({
      code: 'ALM-VIA-001',
      name: 'Almacén Viacha',
      address: 'Zona Industrial, Viacha',
      city: 'Viacha',
      phone: '+591 22222222',
      latitude: -16.5833,
      longitude: -68.2833,
      geofenceRadius: 150,
    });

    const almacenLima = warehouseRepository.create({
      code: 'ALM-LIM-001',
      name: 'Almacén Central Lima',
      address: 'Av. Principal 123, El Alto',
      city: 'El Alto',
      phone: '+591 22233333',
      latitude: -16.5000,
      longitude: -68.1500,
      geofenceRadius: 200,
    });

    const almacenSantaCruz = warehouseRepository.create({
      code: 'ALM-SCZ-001',
      name: 'Almacén Santa Cruz',
      address: 'Parque Industrial Norte',
      city: 'Santa Cruz',
      phone: '+591 33333333',
      latitude: -17.7833,
      longitude: -63.1821,
      geofenceRadius: 150,
    });

    await warehouseRepository.save([
      almacenViacha,
      almacenLima,
      almacenSantaCruz,
    ]);
    console.log('✅ Almacenes creados\n');

    // ========================================
    // 3. PRODUCTOS
    // ========================================
    console.log('📦 Creando productos...');
    const productos = productRepository.create([
      {
        name: 'Laptop Dell Inspiron 15',
        sku: 'TECH-LAPTOP-001',
        description: 'Laptop 15" Intel Core i5, 8GB RAM, 256GB SSD',
        category: 'Tecnología',
        unit: 'unidad',
        unitPrice: 4500.0,
        reorderLevel: 10,
      },
      {
        name: 'Mouse Logitech M185',
        sku: 'TECH-MOUSE-001',
        description: 'Mouse inalámbrico ergonómico',
        category: 'Tecnología',
        unit: 'unidad',
        unitPrice: 85.0,
        reorderLevel: 50,
      },
      {
        name: 'Teclado Mecánico RGB',
        sku: 'TECH-KEYB-001',
        description: 'Teclado mecánico con iluminación RGB',
        category: 'Tecnología',
        unit: 'unidad',
        unitPrice: 450.0,
        reorderLevel: 20,
      },
      {
        name: 'Monitor Samsung 24"',
        sku: 'TECH-MON-001',
        description: 'Monitor Full HD 24 pulgadas',
        category: 'Tecnología',
        unit: 'unidad',
        unitPrice: 1200.0,
        reorderLevel: 15,
      },
      {
        name: 'Impresora HP LaserJet',
        sku: 'TECH-PRINT-001',
        description: 'Impresora láser multifunción',
        category: 'Tecnología',
        unit: 'unidad',
        unitPrice: 2800.0,
        reorderLevel: 5,
      },
    ]);

    await productRepository.save(productos);
    console.log('✅ Productos creados\n');

    // ========================================
    // 4. VEHÍCULOS
    // ========================================
    console.log('🚚 Creando vehículos...');
    const vehiculos = vehicleRepository.create([
      {
        licensePlate: 'ABC-1234',
        type: 'Camión',
        brand: 'Volvo',
        model: 'FH16',
        year: 2020,
        capacity: 15000,
        status: 'available',
        driverId: transportista1.id,
      },
      {
        licensePlate: 'XYZ-5678',
        type: 'Furgoneta',
        brand: 'Mercedes-Benz',
        model: 'Sprinter',
        year: 2021,
        capacity: 5000,
        status: 'available',
        driverId: transportista2.id,
      },
      {
        licensePlate: 'DEF-9012',
        type: 'Camioneta',
        brand: 'Toyota',
        model: 'Hilux',
        year: 2022,
        capacity: 2000,
        status: 'available',
      },
    ]);

    await vehicleRepository.save(vehiculos);
    console.log('✅ Vehículos creados\n');

    // ========================================
    // 5. TRANSFERENCIAS
    // ========================================
    console.log('📋 Creando transferencias...');

    // Transferencia 1: ASIGNADA (lista para que el encargado inicie preparación)
    const transfer1 = transferRepository.create({
      transferCode: `TRF${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}01`,
      originWarehouseId: almacenViacha.id,
      destinationWarehouseId: almacenLima.id,
      vehicleId: vehiculos[0].id,
      driverId: transportista1.id,
      status: TransferStatus.ASIGNADA,
      estimatedDepartureTime: new Date(Date.now() + 86400000), // Mañana
      estimatedArrivalTime: new Date(Date.now() + 259200000), // En 3 días
      notes: 'Transferencia urgente de equipos de oficina',
      qrCode: `TRF-1-${Date.now()}`,
      createdBy: admin.id,
      details: [
        {
          productId: productos[0].id,
          productName: productos[0].name,
          productSku: productos[0].sku,
          quantityExpected: 10,
          unit: productos[0].unit,
        },
        {
          productId: productos[3].id,
          productName: productos[3].name,
          productSku: productos[3].sku,
          quantityExpected: 15,
          unit: productos[3].unit,
        },
      ],
    });

    // Transferencia 2: PENDIENTE (necesita asignación de vehículo)
    const transfer2 = transferRepository.create({
      transferCode: `TRF${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}02`,
      originWarehouseId: almacenLima.id,
      destinationWarehouseId: almacenSantaCruz.id,
      status: TransferStatus.PENDIENTE,
      estimatedDepartureTime: new Date(Date.now() + 172800000), // En 2 días
      estimatedArrivalTime: new Date(Date.now() + 432000000), // En 5 días
      notes: 'Reabastecimiento mensual',
      qrCode: `TRF-2-${Date.now() + 1000}`,
      createdBy: admin.id,
      details: [
        {
          productId: productos[1].id,
          productName: productos[1].name,
          productSku: productos[1].sku,
          quantityExpected: 50,
          unit: productos[1].unit,
        },
        {
          productId: productos[2].id,
          productName: productos[2].name,
          productSku: productos[2].sku,
          quantityExpected: 30,
          unit: productos[2].unit,
        },
      ],
    });

    await transferRepository.save([transfer1, transfer2]);
    console.log('✅ Transferencias creadas\n');

    await queryRunner.commitTransaction();

    console.log('✨ Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   - ${5} usuarios creados`);
    console.log(`   - ${3} almacenes creados`);
    console.log(`   - ${productos.length} productos creados`);
    console.log(`   - ${vehiculos.length} vehículos creados`);
    console.log(`   - ${2} transferencias creadas\n`);

    console.log('🔑 Credenciales de acceso:');
    console.log('   Admin: admin@system.com / password123');
    console.log('   Encargado Viacha: cristian@viacha.com / password123');
    console.log('   Encargado Lima: juan@lima.com / password123');
    console.log('   Transportista 1: maria@transport.com / password123');
    console.log('   Transportista 2: carlos@transport.com / password123\n');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// Si se ejecuta directamente este archivo
if (require.main === module) {
  (async () => {
    const { getDatabaseConfig } = await import('../config/database.config');
    const { ConfigService } = await import('@nestjs/config');
    const configService = new ConfigService();

    const config = getDatabaseConfig(configService);
    const dataSource = new DataSource({
      ...config,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    } as any);

    await dataSource.initialize();
    await seed(dataSource);
    await dataSource.destroy();
    process.exit(0);
  })();
}
