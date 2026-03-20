// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'gps_service_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$gpsServiceHash() => r'0f7e6020e941ea9e8512651654df513cd08f4c10';

/// Provider del GPS Service
///
/// Copied from [gpsService].
@ProviderFor(gpsService)
final gpsServiceProvider = Provider<GpsService>.internal(
  gpsService,
  name: r'gpsServiceProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$gpsServiceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef GpsServiceRef = ProviderRef<GpsService>;
String _$gpsStatusHash() => r'c6e5e4130f8751c05088eb17497d86e0ea8d5fc1';

/// Provider del estado del GPS
///
/// Copied from [gpsStatus].
@ProviderFor(gpsStatus)
final gpsStatusProvider = AutoDisposeFutureProvider<GpsStatus>.internal(
  gpsStatus,
  name: r'gpsStatusProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$gpsStatusHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef GpsStatusRef = AutoDisposeFutureProviderRef<GpsStatus>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
