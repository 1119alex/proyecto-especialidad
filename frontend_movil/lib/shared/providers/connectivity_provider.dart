import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'connectivity_provider.g.dart';

/// Provider para monitorear el estado de la conexión
@riverpod
Stream<bool> connectivityStatus(ConnectivityStatusRef ref) {
  return Connectivity().onConnectivityChanged.map((result) {
    // Devuelve true si hay conexión (WiFi, Mobile, Ethernet)
    return result != ConnectivityResult.none;
  });
}

/// Provider que devuelve el estado actual de conexión
@riverpod
class ConnectivityState extends _$ConnectivityState {
  @override
  Future<bool> build() async {
    final result = await Connectivity().checkConnectivity();
    return result != ConnectivityResult.none;
  }

  /// Refrescar manualmente el estado de conexión
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final result = await Connectivity().checkConnectivity();
      return result != ConnectivityResult.none;
    });
  }
}
