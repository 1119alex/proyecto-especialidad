import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../services/api/api_client_provider.dart';
import '../../../../shared/providers/secure_storage_provider.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/repositories/auth_repository.dart';

part 'auth_providers.g.dart';

/// Provider del datasource remoto de auth
@riverpod
AuthRemoteDatasource authRemoteDatasource(AuthRemoteDatasourceRef ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthRemoteDatasource(apiClient: apiClient);
}

/// Provider del repositorio de auth
@riverpod
AuthRepository authRepository(AuthRepositoryRef ref) {
  final remoteDatasource = ref.watch(authRemoteDatasourceProvider);
  final storageManager = ref.watch(secureStorageManagerProvider.notifier);

  return AuthRepositoryImpl(
    remoteDatasource: remoteDatasource,
    storageManager: storageManager,
  );
}
