import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'tables/users_table.dart';
import 'tables/transfers_table.dart';
import 'tables/tracking_logs_table.dart';
import 'tables/products_table.dart';
import 'tables/warehouses_table.dart';
import 'tables/vehicles_table.dart';

part 'database.g.dart';

/// Base de datos local para modo offline
@DriftDatabase(tables: [
  Users,
  Transfers,
  TrackingLogs,
  Products,
  Warehouses,
  Vehicles,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  static QueryExecutor _openConnection() {
    return driftDatabase(
      name: 'logitrack_db',
      web: DriftWebOptions(
        sqlite3Wasm: Uri.parse('sqlite3.wasm'),
        driftWorker: Uri.parse('drift_worker.js'),
      ),
    );
  }

  @override
  int get schemaVersion => 1;

  // ==================== TRANSFERS ====================

  /// Obtener transferencias que necesitan sincronización
  Future<List<Transfer>> getPendingSyncTransfers() {
    return (select(transfers)..where((t) => t.needsSync.equals(true))).get();
  }

  /// Obtener transferencias por estado
  Future<List<Transfer>> getTransfersByStatus(String status) {
    return (select(transfers)..where((t) => t.status.equals(status))).get();
  }

  /// Obtener transferencia por ID remoto
  Future<Transfer?> getTransferByRemoteId(int remoteId) {
    return (select(transfers)..where((t) => t.remoteId.equals(remoteId)))
        .getSingleOrNull();
  }

  /// Insertar o actualizar transferencia
  Future<int> upsertTransfer(TransfersCompanion transfer) {
    return into(transfers).insertOnConflictUpdate(transfer);
  }

  /// Marcar transferencia para sincronizar
  Future<void> markTransferForSync(int transferId, String action) {
    return (update(transfers)..where((t) => t.id.equals(transferId))).write(
      TransfersCompanion(
        needsSync: const Value(true),
        syncAction: Value(action),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  // ==================== TRACKING LOGS ====================

  /// Obtener logs de tracking pendientes de sincronización
  Future<List<TrackingLog>> getPendingSyncTrackingLogs() {
    return (select(trackingLogs)..where((t) => t.needsSync.equals(true))).get();
  }

  /// Insertar log de tracking
  Future<int> insertTrackingLog(TrackingLogsCompanion log) {
    return into(trackingLogs).insert(log);
  }

  /// Obtener últimos logs de una transferencia
  Future<List<TrackingLog>> getTrackingLogsByTransfer(
    int transferId, {
    int limit = 50,
  }) {
    return (select(trackingLogs)
          ..where((t) => t.transferId.equals(transferId))
          ..orderBy([
            (t) => OrderingTerm(expression: t.timestamp, mode: OrderingMode.desc)
          ])
          ..limit(limit))
        .get();
  }

  // ==================== USERS ====================

  /// Obtener usuario por ID remoto
  Future<User?> getUserByRemoteId(int remoteId) {
    return (select(users)..where((u) => u.remoteId.equals(remoteId)))
        .getSingleOrNull();
  }

  /// Upsert usuario
  Future<int> upsertUser(UsersCompanion user) {
    return into(users).insertOnConflictUpdate(user);
  }

  // ==================== PRODUCTS ====================

  /// Obtener todos los productos
  Future<List<Product>> getAllProducts() {
    return select(products).get();
  }

  /// Buscar productos por nombre
  Future<List<Product>> searchProducts(String query) {
    return (select(products)
          ..where((p) => p.name.like('%$query%') | p.sku.like('%$query%')))
        .get();
  }

  /// Upsert producto
  Future<int> upsertProduct(ProductsCompanion product) {
    return into(products).insertOnConflictUpdate(product);
  }

  // ==================== WAREHOUSES ====================

  /// Obtener todos los almacenes
  Future<List<Warehouse>> getAllWarehouses() {
    return select(warehouses).get();
  }

  /// Obtener almacén por ID remoto
  Future<Warehouse?> getWarehouseByRemoteId(int remoteId) {
    return (select(warehouses)..where((w) => w.remoteId.equals(remoteId)))
        .getSingleOrNull();
  }

  /// Upsert almacén
  Future<int> upsertWarehouse(WarehousesCompanion warehouse) {
    return into(warehouses).insertOnConflictUpdate(warehouse);
  }

  // ==================== VEHICLES ====================

  /// Obtener todos los vehículos
  Future<List<Vehicle>> getAllVehicles() {
    return select(vehicles).get();
  }

  /// Obtener vehículos disponibles
  Future<List<Vehicle>> getAvailableVehicles() {
    return (select(vehicles)..where((v) => v.available.equals(true))).get();
  }

  /// Upsert vehículo
  Future<int> upsertVehicle(VehiclesCompanion vehicle) {
    return into(vehicles).insertOnConflictUpdate(vehicle);
  }

  // ==================== SYNC HELPERS ====================

  /// Limpiar caché antiguo
  Future<void> cleanOldCache({Duration maxAge = const Duration(days: 7)}) async {
    final cutoffDate = DateTime.now().subtract(maxAge);

    // Limpiar tracking logs antiguos
    await (delete(trackingLogs)
          ..where((t) => t.timestamp.isSmallerThanValue(cutoffDate)))
        .go();

    // Limpiar transferencias completadas antiguas
    await (delete(transfers)
          ..where(
            (t) =>
                t.status.equals('COMPLETADA') &
                t.completedAt.isSmallerThanValue(cutoffDate),
          ))
        .go();
  }

  /// Contar elementos pendientes de sincronización
  Future<int> countPendingSync() async {
    final transfersCount = await (select(transfers)
          ..where((t) => t.needsSync.equals(true)))
        .get()
        .then((list) => list.length);

    final logsCount = await (select(trackingLogs)
          ..where((t) => t.needsSync.equals(true)))
        .get()
        .then((list) => list.length);

    return transfersCount + logsCount;
  }
}
