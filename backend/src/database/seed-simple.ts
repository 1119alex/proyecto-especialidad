import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { UserRole } from '../common/enums/user-role.enum';

/**
 * Script de seed simplificado para crear datos básicos
 * Ejecutar con: npm run seed
 */

async function runSeed() {
  console.log('🌱 Iniciando seed simplificado...\n');

  // Configuración de conexión
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'inventory_transfer',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos\n');

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ========================================
    // 1. USUARIOS
    // ========================================
    console.log('👥 Creando usuarios...');
    const userRepository = dataSource.getRepository(User);

    // Admin
    let admin = await userRepository.findOne({
      where: { email: 'admin@system.com' },
    });
    if (!admin) {
      admin = userRepository.create({
        email: 'admin@system.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'Sistema',
        role: UserRole.ADMIN,
        phone: '+591 70000000',
      });
      await userRepository.save(admin);
      console.log('   ✓ Admin creado');
    } else {
      console.log('   ⊙ Admin ya existe');
    }

    // Encargado Viacha
    let encargadoViacha = await userRepository.findOne({
      where: { email: 'cristian@viacha.com' },
    });
    if (!encargadoViacha) {
      encargadoViacha = userRepository.create({
        email: 'cristian@viacha.com',
        passwordHash: hashedPassword,
        firstName: 'Cristian',
        lastName: 'Pérez',
        role: UserRole.ENCARGADO_ALMACEN,
        phone: '+591 70111111',
      });
      await userRepository.save(encargadoViacha);
      console.log('   ✓ Encargado Viacha creado');
    } else {
      console.log('   ⊙ Encargado Viacha ya existe');
    }

    // Encargado Lima
    let encargadoLima = await userRepository.findOne({
      where: { email: 'juan@lima.com' },
    });
    if (!encargadoLima) {
      encargadoLima = userRepository.create({
        email: 'juan@lima.com',
        passwordHash: hashedPassword,
        firstName: 'Juan',
        lastName: 'González',
        role: UserRole.ENCARGADO_ALMACEN,
        phone: '+591 70222222',
      });
      await userRepository.save(encargadoLima);
      console.log('   ✓ Encargado Lima creado');
    } else {
      console.log('   ⊙ Encargado Lima ya existe');
    }

    // Transportista 1
    let transportista1 = await userRepository.findOne({
      where: { email: 'maria@transport.com' },
    });
    if (!transportista1) {
      transportista1 = userRepository.create({
        email: 'maria@transport.com',
        passwordHash: hashedPassword,
        firstName: 'María',
        lastName: 'Rodríguez',
        role: UserRole.TRANSPORTISTA,
        phone: '+591 70333333',
      });
      await userRepository.save(transportista1);
      console.log('   ✓ Transportista 1 creado');
    } else {
      console.log('   ⊙ Transportista 1 ya existe');
    }

    console.log('✅ Usuarios completados\n');

    // ========================================
    // 2. ALMACENES
    // ========================================
    console.log('🏢 Creando almacenes...');
    const warehouseRepository = dataSource.getRepository(Warehouse);

    // Almacén Viacha
    let almacenViacha = await warehouseRepository.findOne({
      where: { code: 'ALM-VIA-001' },
    });
    if (!almacenViacha) {
      almacenViacha = warehouseRepository.create({
        code: 'ALM-VIA-001',
        name: 'Almacén Viacha',
        address: 'Zona Industrial, Viacha',
        city: 'Viacha',
        phone: '+591 22222222',
        latitude: -16.5833,
        longitude: -68.2833,
        geofenceRadius: 150,
      });
      await warehouseRepository.save(almacenViacha);
      console.log('   ✓ Almacén Viacha creado');
    } else {
      console.log('   ⊙ Almacén Viacha ya existe');
    }

    // Almacén Lima
    let almacenLima = await warehouseRepository.findOne({
      where: { code: 'ALM-LIM-001' },
    });
    if (!almacenLima) {
      almacenLima = warehouseRepository.create({
        code: 'ALM-LIM-001',
        name: 'Almacén Central Lima',
        address: 'Av. Principal 123, El Alto',
        city: 'El Alto',
        phone: '+591 22233333',
        latitude: -16.5,
        longitude: -68.15,
        geofenceRadius: 200,
      });
      await warehouseRepository.save(almacenLima);
      console.log('   ✓ Almacén Lima creado');
    } else {
      console.log('   ⊙ Almacén Lima ya existe');
    }

    // Almacén Santa Cruz
    let almacenSantaCruz = await warehouseRepository.findOne({
      where: { code: 'ALM-SCZ-001' },
    });
    if (!almacenSantaCruz) {
      almacenSantaCruz = warehouseRepository.create({
        code: 'ALM-SCZ-001',
        name: 'Almacén Santa Cruz',
        address: 'Parque Industrial Norte',
        city: 'Santa Cruz',
        phone: '+591 33333333',
        latitude: -17.7833,
        longitude: -63.1821,
        geofenceRadius: 150,
      });
      await warehouseRepository.save(almacenSantaCruz);
      console.log('   ✓ Almacén Santa Cruz creado');
    } else {
      console.log('   ⊙ Almacén Santa Cruz ya existe');
    }

    console.log('✅ Almacenes completados\n');

    console.log('✨ Seed completado exitosamente!\n');
    console.log('🔑 Credenciales de acceso:');
    console.log('   Admin: admin@system.com / password123');
    console.log('   Encargado Viacha: cristian@viacha.com / password123');
    console.log('   Encargado Lima: juan@lima.com / password123');
    console.log('   Transportista: maria@transport.com / password123\n');

    console.log('📝 Nota: Los productos, vehículos y transferencias deben crearse desde el frontend web.\n');

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeed();
