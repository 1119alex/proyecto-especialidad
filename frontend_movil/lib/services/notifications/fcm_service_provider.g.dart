// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'fcm_service_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$fcmServiceHash() => r'10d50ba1343f0dfe2a9db65d491106dd77708c54';

/// Provider del FCM Service
///
/// Copied from [fcmService].
@ProviderFor(fcmService)
final fcmServiceProvider = Provider<FcmService>.internal(
  fcmService,
  name: r'fcmServiceProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$fcmServiceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef FcmServiceRef = ProviderRef<FcmService>;
String _$fcmTokenHash() => r'c81f0155738683ebce5ba44ee0ca56cd8c34aaf1';

/// Provider para inicializar FCM y obtener el token
///
/// Copied from [fcmToken].
@ProviderFor(fcmToken)
final fcmTokenProvider = AutoDisposeFutureProvider<String?>.internal(
  fcmToken,
  name: r'fcmTokenProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$fcmTokenHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef FcmTokenRef = AutoDisposeFutureProviderRef<String?>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
