import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'secure_storage_provider.g.dart';

/// Provider de Secure Storage para almacenar tokens y datos sensibles
@Riverpod(keepAlive: true)
FlutterSecureStorage secureStorage(SecureStorageRef ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
  );
}

/// Helper para gestionar tokens y auth data
@Riverpod(keepAlive: true)
class SecureStorageManager extends _$SecureStorageManager {
  late FlutterSecureStorage _storage;

  @override
  Future<void> build() async {
    _storage = ref.read(secureStorageProvider);
  }

  // ==================== JWT TOKEN ====================

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: 'auth_token');
  }

  // ==================== REFRESH TOKEN ====================

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: 'refresh_token', value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: 'refresh_token');
  }

  // ==================== USER DATA ====================

  Future<void> saveUserRole(String role) async {
    await _storage.write(key: 'user_role', value: role);
  }

  Future<String?> getUserRole() async {
    return await _storage.read(key: 'user_role');
  }

  Future<void> saveUserId(String userId) async {
    await _storage.write(key: 'user_id', value: userId);
  }

  Future<String?> getUserId() async {
    return await _storage.read(key: 'user_id');
  }

  // ==================== CLEAR ALL ====================

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  // ==================== HELPERS ====================

  Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
