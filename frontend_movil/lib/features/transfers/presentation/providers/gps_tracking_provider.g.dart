// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'gps_tracking_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$gpsTrackingDatasourceHash() =>
    r'a4785d4c6642b7eba7d1ad27d540357af6ec51fb';

/// Provider del datasource de GPS tracking
///
/// Copied from [gpsTrackingDatasource].
@ProviderFor(gpsTrackingDatasource)
final gpsTrackingDatasourceProvider =
    AutoDisposeProvider<GPSTrackingDatasource>.internal(
  gpsTrackingDatasource,
  name: r'gpsTrackingDatasourceProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$gpsTrackingDatasourceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef GpsTrackingDatasourceRef
    = AutoDisposeProviderRef<GPSTrackingDatasource>;
String _$trackingHistoryHash() => r'6c7562b227f717cfe1321e39f810acc0c9325537';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// Provider para obtener historial de tracking
///
/// Copied from [trackingHistory].
@ProviderFor(trackingHistory)
const trackingHistoryProvider = TrackingHistoryFamily();

/// Provider para obtener historial de tracking
///
/// Copied from [trackingHistory].
class TrackingHistoryFamily
    extends Family<AsyncValue<List<Map<String, dynamic>>>> {
  /// Provider para obtener historial de tracking
  ///
  /// Copied from [trackingHistory].
  const TrackingHistoryFamily();

  /// Provider para obtener historial de tracking
  ///
  /// Copied from [trackingHistory].
  TrackingHistoryProvider call(
    int transferId,
  ) {
    return TrackingHistoryProvider(
      transferId,
    );
  }

  @override
  TrackingHistoryProvider getProviderOverride(
    covariant TrackingHistoryProvider provider,
  ) {
    return call(
      provider.transferId,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'trackingHistoryProvider';
}

/// Provider para obtener historial de tracking
///
/// Copied from [trackingHistory].
class TrackingHistoryProvider
    extends AutoDisposeFutureProvider<List<Map<String, dynamic>>> {
  /// Provider para obtener historial de tracking
  ///
  /// Copied from [trackingHistory].
  TrackingHistoryProvider(
    int transferId,
  ) : this._internal(
          (ref) => trackingHistory(
            ref as TrackingHistoryRef,
            transferId,
          ),
          from: trackingHistoryProvider,
          name: r'trackingHistoryProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$trackingHistoryHash,
          dependencies: TrackingHistoryFamily._dependencies,
          allTransitiveDependencies:
              TrackingHistoryFamily._allTransitiveDependencies,
          transferId: transferId,
        );

  TrackingHistoryProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.transferId,
  }) : super.internal();

  final int transferId;

  @override
  Override overrideWith(
    FutureOr<List<Map<String, dynamic>>> Function(TrackingHistoryRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: TrackingHistoryProvider._internal(
        (ref) => create(ref as TrackingHistoryRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        transferId: transferId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<Map<String, dynamic>>> createElement() {
    return _TrackingHistoryProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is TrackingHistoryProvider && other.transferId == transferId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, transferId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin TrackingHistoryRef
    on AutoDisposeFutureProviderRef<List<Map<String, dynamic>>> {
  /// The parameter `transferId` of this provider.
  int get transferId;
}

class _TrackingHistoryProviderElement
    extends AutoDisposeFutureProviderElement<List<Map<String, dynamic>>>
    with TrackingHistoryRef {
  _TrackingHistoryProviderElement(super.provider);

  @override
  int get transferId => (origin as TrackingHistoryProvider).transferId;
}

String _$latestTrackingHash() => r'cc9b55bce124111fcae5cf4509b37b5a56d9243b';

/// Provider para obtener última ubicación
///
/// Copied from [latestTracking].
@ProviderFor(latestTracking)
const latestTrackingProvider = LatestTrackingFamily();

/// Provider para obtener última ubicación
///
/// Copied from [latestTracking].
class LatestTrackingFamily extends Family<AsyncValue<Map<String, dynamic>?>> {
  /// Provider para obtener última ubicación
  ///
  /// Copied from [latestTracking].
  const LatestTrackingFamily();

  /// Provider para obtener última ubicación
  ///
  /// Copied from [latestTracking].
  LatestTrackingProvider call(
    int transferId,
  ) {
    return LatestTrackingProvider(
      transferId,
    );
  }

  @override
  LatestTrackingProvider getProviderOverride(
    covariant LatestTrackingProvider provider,
  ) {
    return call(
      provider.transferId,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'latestTrackingProvider';
}

/// Provider para obtener última ubicación
///
/// Copied from [latestTracking].
class LatestTrackingProvider
    extends AutoDisposeFutureProvider<Map<String, dynamic>?> {
  /// Provider para obtener última ubicación
  ///
  /// Copied from [latestTracking].
  LatestTrackingProvider(
    int transferId,
  ) : this._internal(
          (ref) => latestTracking(
            ref as LatestTrackingRef,
            transferId,
          ),
          from: latestTrackingProvider,
          name: r'latestTrackingProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$latestTrackingHash,
          dependencies: LatestTrackingFamily._dependencies,
          allTransitiveDependencies:
              LatestTrackingFamily._allTransitiveDependencies,
          transferId: transferId,
        );

  LatestTrackingProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.transferId,
  }) : super.internal();

  final int transferId;

  @override
  Override overrideWith(
    FutureOr<Map<String, dynamic>?> Function(LatestTrackingRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: LatestTrackingProvider._internal(
        (ref) => create(ref as LatestTrackingRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        transferId: transferId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<Map<String, dynamic>?> createElement() {
    return _LatestTrackingProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is LatestTrackingProvider && other.transferId == transferId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, transferId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin LatestTrackingRef on AutoDisposeFutureProviderRef<Map<String, dynamic>?> {
  /// The parameter `transferId` of this provider.
  int get transferId;
}

class _LatestTrackingProviderElement
    extends AutoDisposeFutureProviderElement<Map<String, dynamic>?>
    with LatestTrackingRef {
  _LatestTrackingProviderElement(super.provider);

  @override
  int get transferId => (origin as LatestTrackingProvider).transferId;
}

String _$gPSTrackerHash() => r'3711316705593b12dc103f14eb36f7729577f53c';

/// Provider para enviar ubicación GPS al backend
///
/// Copied from [GPSTracker].
@ProviderFor(GPSTracker)
final gPSTrackerProvider =
    AutoDisposeAsyncNotifierProvider<GPSTracker, void>.internal(
  GPSTracker.new,
  name: r'gPSTrackerProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$gPSTrackerHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$GPSTracker = AutoDisposeAsyncNotifier<void>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
