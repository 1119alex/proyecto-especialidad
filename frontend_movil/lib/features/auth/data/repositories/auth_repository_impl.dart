import '../../../../shared/providers/secure_storage_provider.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';

/// Implementación del repositorio de autenticación
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDatasource _remoteDatasource;
  final SecureStorageManager _storageManager;

  AuthRepositoryImpl({
    required AuthRemoteDatasource remoteDatasource,
    required SecureStorageManager storageManager,
  })  : _remoteDatasource = remoteDatasource,
        _storageManager = storageManager;

  @override
  Future<({String token, UserEntity user})> login({
    required String email,
    required String password,
  }) async {
    // Llamar al datasource remoto
    final response = await _remoteDatasource.login(
      email: email,
      password: password,
    );

    // Guardar token en secure storage
    await _storageManager.saveToken(response.accessToken);
    await _storageManager.saveUserRole(response.user.role);
    await _storageManager.saveUserId(response.user.id.toString());

    // Retornar token y usuario como entidad
    return (
      token: response.accessToken,
      user: response.user.toEntity(),
    );
  }

  @override
  Future<void> logout() async {
    // Limpiar secure storage
    await _storageManager.clearAll();

    // Notificar al backend (opcional)
    await _remoteDatasource.logout();
  }

  @override
  Future<UserEntity?> getCurrentUser() async {
    try {
      final hasToken = await _storageManager.hasToken();
      if (!hasToken) return null;

      final userModel = await _remoteDatasource.getCurrentUser();
      return userModel.toEntity();
    } catch (e) {
      // Si falla, limpiar storage (token expirado)
      await _storageManager.clearAll();
      return null;
    }
  }

  @override
  Future<bool> hasActiveSession() async {
    return await _storageManager.hasToken();
  }
}
