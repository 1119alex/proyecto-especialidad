import 'dart:convert';

import 'package:drift/drift.dart';

import '../../../../config/drift/database.dart';
import '../models/transfer_model.dart';

/// Datasource local (Drift) para Transfers.
///
/// Cachea la respuesta del backend para habilitar lectura offline (RNF05).
/// El JSON completo de cada transferencia se guarda en la columna `details`,
/// de modo que al reconstruirlo offline se conservan las relaciones expandidas
/// (almacenes, vehículo, conductor, productos) que necesita la UI.
class TransfersLocalDatasource {
  final AppDatabase _db;

  TransfersLocalDatasource({required AppDatabase database}) : _db = database;

  /// Guarda/actualiza un lote de transferencias en el caché local.
  Future<void> cacheTransfers(List<TransferModel> models) async {
    for (final model in models) {
      await cacheTransfer(model);
    }
  }

  /// Guarda/actualiza una transferencia en el caché local (por su ID remoto).
  Future<void> cacheTransfer(TransferModel model) async {
    final companion = TransfersCompanion(
      remoteId: Value(model.id),
      qrCode: Value(model.qrCode ?? ''),
      status: Value(model.status),
      originWarehouseId: Value(model.originWarehouseId),
      destinyWarehouseId: Value(model.destinationWarehouseId),
      vehicleId: Value(model.vehicleId),
      driverId: Value(model.driverId),
      createdById: Value(model.createdByUserId),
      createdAt: Value(model.createdAt),
      updatedAt: Value(model.updatedAt),
      completedAt: Value(model.completedAt),
      details: Value(jsonEncode(model.toJson())),
      needsSync: const Value(false),
    );
    await _db.upsertTransferByRemoteId(model.id, companion);
  }

  /// Lee todas las transferencias cacheadas (más recientes primero).
  Future<List<TransferModel>> getCachedTransfers() async {
    final rows = await _db.getAllTransfersOrdered();
    return rows.map(_rowToModel).whereType<TransferModel>().toList();
  }

  /// Lee una transferencia cacheada por su ID remoto.
  Future<TransferModel?> getCachedTransfer(int remoteId) async {
    final row = await _db.getTransferByRemoteId(remoteId);
    if (row == null) return null;
    return _rowToModel(row);
  }

  /// Lee las transferencias cacheadas filtradas por estado.
  Future<List<TransferModel>> getCachedTransfersByStatus(String status) async {
    final all = await getCachedTransfers();
    return all
        .where((t) => t.status.toUpperCase() == status.toUpperCase())
        .toList();
  }

  /// Reconstruye el modelo a partir del JSON guardado en `details`.
  TransferModel? _rowToModel(Transfer row) {
    final raw = row.details;
    if (raw == null || raw.isEmpty) return null;
    try {
      return TransferModel.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      // Caché corrupto o de un esquema anterior: se ignora esa fila.
      return null;
    }
  }
}
