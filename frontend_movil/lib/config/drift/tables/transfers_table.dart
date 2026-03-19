import 'package:drift/drift.dart';

/// Tabla de Transferencias
class Transfers extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get remoteId => integer().nullable()(); // ID del backend
  TextColumn get qrCode => text()();
  TextColumn get status => text()(); // PENDIENTE, ASIGNADA, EN_TRANSITO, etc.

  // Referencias
  IntColumn get originWarehouseId => integer()();
  IntColumn get destinyWarehouseId => integer()();
  IntColumn get vehicleId => integer().nullable()();
  IntColumn get driverId => integer().nullable()();
  IntColumn get createdById => integer()();

  // Timestamps
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get startedAt => dateTime().nullable()();
  DateTimeColumn get completedAt => dateTime().nullable()();

  // Control de sincronización
  BoolColumn get needsSync => boolean().withDefault(const Constant(false))();
  TextColumn get syncAction => text().nullable()(); // CREATE, UPDATE, DELETE

  // Datos adicionales en JSON
  TextColumn get details => text().nullable()(); // JSON con productos y cantidades
}
