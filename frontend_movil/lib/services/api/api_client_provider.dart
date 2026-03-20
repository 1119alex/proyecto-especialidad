import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../shared/providers/secure_storage_provider.dart';
import 'api_client.dart';

part 'api_client_provider.g.dart';

/// Provider del API Client
@Riverpod(keepAlive: true)
ApiClient apiClient(ApiClientRef ref) {
  final secureStorage = ref.watch(secureStorageProvider);

  return ApiClient(
    secureStorage: secureStorage,
  );
}
