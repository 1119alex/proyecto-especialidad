import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../services/api/api_client_provider.dart';
import '../../data/datasources/gps_tracking_datasource.dart';

part 'gps_tracking_provider.g.dart';

/// Provider del datasource de GPS tracking
@riverpod
GPSTrackingDatasource gpsTrackingDatasource(GpsTrackingDatasourceRef ref) {
  final apiClient = ref.watch(apiClientProvider);
  return GPSTrackingDatasource(apiClient: apiClient);
}

/// Provider para enviar ubicación GPS al backend
@riverpod
class GPSTracker extends _$GPSTracker {
  @override
  FutureOr<void> build() {
    return null;
  }

  /// Enviar ubicación GPS al backend
  Future<void> sendLocation({
    required int transferId,
    required double latitude,
    required double longitude,
    double? speed,
    double? accuracy,
  }) async {
    state = const AsyncValue.loading();

    try {
      final datasource = ref.read(gpsTrackingDatasourceProvider);
      await datasource.addGPSTracking(
        transferId: transferId,
        latitude: latitude,
        longitude: longitude,
        speed: speed,
        accuracy: accuracy,
      );

      state = const AsyncValue.data(null);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
      // No lanzamos excepción para que no interrumpa el tracking
      // Solo registramos el error
    }
  }

  /// Reset state
  void reset() {
    state = const AsyncValue.data(null);
  }
}

/// Provider para obtener historial de tracking
@riverpod
Future<List<Map<String, dynamic>>> trackingHistory(
    TrackingHistoryRef ref, int transferId) async {
  final datasource = ref.watch(gpsTrackingDatasourceProvider);
  return datasource.getTrackingHistory(transferId);
}

/// Provider para obtener última ubicación
@riverpod
Future<Map<String, dynamic>?> latestTracking(
    LatestTrackingRef ref, int transferId) async {
  final datasource = ref.watch(gpsTrackingDatasourceProvider);
  return datasource.getLatestTracking(transferId);
}
