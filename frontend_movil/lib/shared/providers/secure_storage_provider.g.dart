// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'secure_storage_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$secureStorageHash() => r'db6c9f3b2c0f5615fcf2b7d1451ea65c67256082';

/// Provider de Secure Storage para almacenar tokens y datos sensibles
///
/// Copied from [secureStorage].
@ProviderFor(secureStorage)
final secureStorageProvider = Provider<FlutterSecureStorage>.internal(
  secureStorage,
  name: r'secureStorageProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$secureStorageHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef SecureStorageRef = ProviderRef<FlutterSecureStorage>;
String _$secureStorageManagerHash() =>
    r'a15376fe782002852758573cef9f025891c8f264';

/// Helper para gestionar tokens y auth data
///
/// Copied from [SecureStorageManager].
@ProviderFor(SecureStorageManager)
final secureStorageManagerProvider =
    AsyncNotifierProvider<SecureStorageManager, void>.internal(
  SecureStorageManager.new,
  name: r'secureStorageManagerProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$secureStorageManagerHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$SecureStorageManager = AsyncNotifier<void>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
