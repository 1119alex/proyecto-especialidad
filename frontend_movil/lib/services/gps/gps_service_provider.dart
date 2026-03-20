import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'gps_service.dart';

part 'gps_service_provider.g.dart';

/// Provider del GPS Service
@Riverpod(keepAlive: true)
GpsService gpsService(GpsServiceRef ref) {
  return GpsService();
}

/// Provider del estado del GPS
@riverpod
Future<GpsStatus> gpsStatus(GpsStatusRef ref) async {
  final gpsService = ref.watch(gpsServiceProvider);
  return await gpsService.getGpsStatus();
}
