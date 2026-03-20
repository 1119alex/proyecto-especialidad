import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'fcm_service.dart';

part 'fcm_service_provider.g.dart';

/// Provider del FCM Service
@Riverpod(keepAlive: true)
FcmService fcmService(FcmServiceRef ref) {
  return FcmService();
}

/// Provider para inicializar FCM y obtener el token
@riverpod
Future<String?> fcmToken(FcmTokenRef ref) async {
  final fcmService = ref.watch(fcmServiceProvider);
  return await fcmService.initialize();
}
