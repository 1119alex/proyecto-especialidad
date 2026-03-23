import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../services/api/api_client_provider.dart';
import '../../data/datasources/transfers_remote_datasource.dart';
import '../../data/repositories/transfers_repository_impl.dart';
import '../../domain/entities/transfer_entity.dart';
import '../../domain/repositories/transfers_repository.dart';

part 'transfers_provider.g.dart';

/// Provider del datasource
@riverpod
TransfersRemoteDatasource transfersRemoteDatasource(
    TransfersRemoteDatasourceRef ref) {
  final apiClient = ref.watch(apiClientProvider);
  return TransfersRemoteDatasource(apiClient: apiClient);
}

/// Provider del repository
@riverpod
TransfersRepository transfersRepository(TransfersRepositoryRef ref) {
  final datasource = ref.watch(transfersRemoteDatasourceProvider);
  return TransfersRepositoryImpl(remoteDatasource: datasource);
}

/// Provider para obtener todas las transferencias
@riverpod
class Transfers extends _$Transfers {
  @override
  Future<List<TransferEntity>> build() async {
    return _fetchTransfers();
  }

  Future<List<TransferEntity>> _fetchTransfers() async {
    final repository = ref.read(transfersRepositoryProvider);
    return await repository.getAllTransfers();
  }

  /// Refrescar la lista de transferencias
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchTransfers());
  }

  /// Filtrar por estado
  Future<void> filterByStatus(String status) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(transfersRepositoryProvider);
      return await repository.getTransfersByStatus(status);
    });
  }
}

/// Provider para obtener una transferencia específica
@riverpod
class TransferDetail extends _$TransferDetail {
  @override
  Future<TransferEntity> build(int transferId) async {
    final repository = ref.read(transfersRepositoryProvider);
    return await repository.getTransferById(transferId);
  }

  /// Refrescar el detalle
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(transfersRepositoryProvider);
      return await repository.getTransferById(transferId);
    });
  }

  /// Iniciar preparación de la transferencia
  Future<void> startPreparation() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final datasource = ref.read(transfersRemoteDatasourceProvider);
      final model = await datasource.startPreparation(transferId);
      // Invalidar el provider de transfers para refrescar la lista
      ref.invalidate(transfersProvider);
      return model.toEntity();
    });
  }

  /// Confirmar llegada al destino
  Future<void> arriveDestination() async {
    print('📍 [PROVIDER] arriveDestination iniciado - Transfer ID: $transferId');

    state = const AsyncValue.loading();
    print('📍 [PROVIDER] State cambiado a loading');

    state = await AsyncValue.guard(() async {
      print('📍 [PROVIDER] Dentro de AsyncValue.guard');

      final datasource = ref.read(transfersRemoteDatasourceProvider);
      print('📍 [PROVIDER] Datasource obtenido');

      print('📍 [PROVIDER] Llamando a datasource.arriveDestination($transferId)');
      final model = await datasource.arriveDestination(transferId);

      print('📍 [PROVIDER] Response recibido: ${model.transferCode} - Estado: ${model.status}');

      // Invalidar el provider de transfers para refrescar la lista
      ref.invalidate(transfersProvider);
      print('📍 [PROVIDER] Providers invalidados');

      final entity = model.toEntity();
      print('📍 [PROVIDER] Entity convertida - Estado final: ${entity.status}');

      return entity;
    });

    print('📍 [PROVIDER] arriveDestination completado - State: ${state.hasValue ? "success" : state.hasError ? "error: ${state.error}" : "loading"}');
  }
}

/// Provider para filtrar transferencias por estado localmente
@riverpod
List<TransferEntity> transfersByStatus(
  TransfersByStatusRef ref,
  String? statusFilter,
) {
  final transfersAsync = ref.watch(transfersProvider);

  return transfersAsync.when(
    data: (transfers) {
      if (statusFilter == null || statusFilter.isEmpty) {
        return transfers;
      }
      return transfers
          .where((transfer) =>
              transfer.status.toUpperCase() == statusFilter.toUpperCase())
          .toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
}

/// Provider para contar transferencias por estado
@riverpod
Map<String, int> transfersCountByStatus(TransfersCountByStatusRef ref) {
  final transfersAsync = ref.watch(transfersProvider);

  return transfersAsync.when(
    data: (transfers) {
      final counts = <String, int>{
        'PENDIENTE': 0,
        'EN_TRANSITO': 0,
        'COMPLETADA': 0,
        'CANCELADA': 0,
      };

      for (final transfer in transfers) {
        final status = transfer.status.toUpperCase();
        counts[status] = (counts[status] ?? 0) + 1;
      }

      return counts;
    },
    loading: () => {},
    error: (_, __) => {},
  );
}
