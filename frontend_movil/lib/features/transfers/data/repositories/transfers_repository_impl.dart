import '../../../../core/errors/network_exception.dart';
import '../../domain/entities/transfer_entity.dart';
import '../../domain/repositories/transfers_repository.dart';
import '../datasources/transfers_local_datasource.dart';
import '../datasources/transfers_remote_datasource.dart';

/// Implementación offline-first del repository de Transfers (RNF05).
///
/// Las lecturas intentan primero el backend y cachean el resultado en Drift;
/// si falla por falta de conexión (NetworkException), se sirve el último
/// estado conocido desde el caché local. Las escrituras requieren conexión.
class TransfersRepositoryImpl implements TransfersRepository {
  final TransfersRemoteDatasource _remoteDatasource;
  final TransfersLocalDatasource _localDatasource;

  TransfersRepositoryImpl({
    required TransfersRemoteDatasource remoteDatasource,
    required TransfersLocalDatasource localDatasource,
  })  : _remoteDatasource = remoteDatasource,
        _localDatasource = localDatasource;

  @override
  Future<List<TransferEntity>> getAllTransfers() async {
    try {
      final models = await _remoteDatasource.getAllTransfers();
      await _localDatasource.cacheTransfers(models);
      return models.map((model) => model.toEntity()).toList();
    } on NetworkException {
      final cached = await _localDatasource.getCachedTransfers();
      return cached.map((model) => model.toEntity()).toList();
    }
  }

  @override
  Future<TransferEntity> getTransferById(int id) async {
    try {
      final model = await _remoteDatasource.getTransferById(id);
      await _localDatasource.cacheTransfer(model);
      return model.toEntity();
    } on NetworkException {
      final cached = await _localDatasource.getCachedTransfer(id);
      if (cached == null) {
        throw const NetworkException(
          'Sin conexión y esta transferencia no está guardada localmente.',
        );
      }
      return cached.toEntity();
    }
  }

  @override
  Future<List<TransferEntity>> getTransfersByStatus(String status) async {
    try {
      final models = await _remoteDatasource.getTransfersByStatus(status);
      await _localDatasource.cacheTransfers(models);
      return models.map((model) => model.toEntity()).toList();
    } on NetworkException {
      final cached = await _localDatasource.getCachedTransfersByStatus(status);
      return cached.map((model) => model.toEntity()).toList();
    }
  }

  @override
  Future<TransferEntity> createTransfer(Map<String, dynamic> data) async {
    final model = await _remoteDatasource.createTransfer(data);
    await _localDatasource.cacheTransfer(model);
    return model.toEntity();
  }

  @override
  Future<TransferEntity> updateTransfer(
      int id, Map<String, dynamic> data) async {
    final model = await _remoteDatasource.updateTransfer(id, data);
    await _localDatasource.cacheTransfer(model);
    return model.toEntity();
  }

  @override
  Future<TransferEntity> assignVehicleAndDriver({
    required int transferId,
    required int vehicleId,
    required int driverId,
  }) async {
    final model = await _remoteDatasource.assignVehicleAndDriver(
      transferId: transferId,
      vehicleId: vehicleId,
      driverId: driverId,
    );
    await _localDatasource.cacheTransfer(model);
    return model.toEntity();
  }

  @override
  Future<void> deleteTransfer(int id) async {
    await _remoteDatasource.deleteTransfer(id);
  }
}
