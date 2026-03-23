// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transfers_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$transfersRemoteDatasourceHash() =>
    r'3393b49aad021723779ba6068d24e36db548ead1';

/// Provider del datasource
///
/// Copied from [transfersRemoteDatasource].
@ProviderFor(transfersRemoteDatasource)
final transfersRemoteDatasourceProvider =
    AutoDisposeProvider<TransfersRemoteDatasource>.internal(
  transfersRemoteDatasource,
  name: r'transfersRemoteDatasourceProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$transfersRemoteDatasourceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef TransfersRemoteDatasourceRef
    = AutoDisposeProviderRef<TransfersRemoteDatasource>;
String _$transfersRepositoryHash() =>
    r'114410206a8636bb2878550bacb1a8dc25bc66e0';

/// Provider del repository
///
/// Copied from [transfersRepository].
@ProviderFor(transfersRepository)
final transfersRepositoryProvider =
    AutoDisposeProvider<TransfersRepository>.internal(
  transfersRepository,
  name: r'transfersRepositoryProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$transfersRepositoryHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef TransfersRepositoryRef = AutoDisposeProviderRef<TransfersRepository>;
String _$transfersByStatusHash() => r'657a1a782ae635b1688b103562c0bccb6d5208ba';

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

/// Provider para filtrar transferencias por estado localmente
///
/// Copied from [transfersByStatus].
@ProviderFor(transfersByStatus)
const transfersByStatusProvider = TransfersByStatusFamily();

/// Provider para filtrar transferencias por estado localmente
///
/// Copied from [transfersByStatus].
class TransfersByStatusFamily extends Family<List<TransferEntity>> {
  /// Provider para filtrar transferencias por estado localmente
  ///
  /// Copied from [transfersByStatus].
  const TransfersByStatusFamily();

  /// Provider para filtrar transferencias por estado localmente
  ///
  /// Copied from [transfersByStatus].
  TransfersByStatusProvider call(
    String? statusFilter,
  ) {
    return TransfersByStatusProvider(
      statusFilter,
    );
  }

  @override
  TransfersByStatusProvider getProviderOverride(
    covariant TransfersByStatusProvider provider,
  ) {
    return call(
      provider.statusFilter,
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
  String? get name => r'transfersByStatusProvider';
}

/// Provider para filtrar transferencias por estado localmente
///
/// Copied from [transfersByStatus].
class TransfersByStatusProvider
    extends AutoDisposeProvider<List<TransferEntity>> {
  /// Provider para filtrar transferencias por estado localmente
  ///
  /// Copied from [transfersByStatus].
  TransfersByStatusProvider(
    String? statusFilter,
  ) : this._internal(
          (ref) => transfersByStatus(
            ref as TransfersByStatusRef,
            statusFilter,
          ),
          from: transfersByStatusProvider,
          name: r'transfersByStatusProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$transfersByStatusHash,
          dependencies: TransfersByStatusFamily._dependencies,
          allTransitiveDependencies:
              TransfersByStatusFamily._allTransitiveDependencies,
          statusFilter: statusFilter,
        );

  TransfersByStatusProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.statusFilter,
  }) : super.internal();

  final String? statusFilter;

  @override
  Override overrideWith(
    List<TransferEntity> Function(TransfersByStatusRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: TransfersByStatusProvider._internal(
        (ref) => create(ref as TransfersByStatusRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        statusFilter: statusFilter,
      ),
    );
  }

  @override
  AutoDisposeProviderElement<List<TransferEntity>> createElement() {
    return _TransfersByStatusProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is TransfersByStatusProvider &&
        other.statusFilter == statusFilter;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, statusFilter.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin TransfersByStatusRef on AutoDisposeProviderRef<List<TransferEntity>> {
  /// The parameter `statusFilter` of this provider.
  String? get statusFilter;
}

class _TransfersByStatusProviderElement
    extends AutoDisposeProviderElement<List<TransferEntity>>
    with TransfersByStatusRef {
  _TransfersByStatusProviderElement(super.provider);

  @override
  String? get statusFilter =>
      (origin as TransfersByStatusProvider).statusFilter;
}

String _$transfersCountByStatusHash() =>
    r'f810c24faa324ae1cd12e13aa52d1cca970a3a63';

/// Provider para contar transferencias por estado
///
/// Copied from [transfersCountByStatus].
@ProviderFor(transfersCountByStatus)
final transfersCountByStatusProvider =
    AutoDisposeProvider<Map<String, int>>.internal(
  transfersCountByStatus,
  name: r'transfersCountByStatusProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$transfersCountByStatusHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef TransfersCountByStatusRef = AutoDisposeProviderRef<Map<String, int>>;
String _$transfersHash() => r'93194b7b94c85d4fd045ad70c8c9d8367e2345f0';

/// Provider para obtener todas las transferencias
///
/// Copied from [Transfers].
@ProviderFor(Transfers)
final transfersProvider =
    AutoDisposeAsyncNotifierProvider<Transfers, List<TransferEntity>>.internal(
  Transfers.new,
  name: r'transfersProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$transfersHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$Transfers = AutoDisposeAsyncNotifier<List<TransferEntity>>;
String _$transferDetailHash() => r'87d3cba852f43773cd92f1d2ef8e0e9898a7cc7e';

abstract class _$TransferDetail
    extends BuildlessAutoDisposeAsyncNotifier<TransferEntity> {
  late final int transferId;

  FutureOr<TransferEntity> build(
    int transferId,
  );
}

/// Provider para obtener una transferencia específica
///
/// Copied from [TransferDetail].
@ProviderFor(TransferDetail)
const transferDetailProvider = TransferDetailFamily();

/// Provider para obtener una transferencia específica
///
/// Copied from [TransferDetail].
class TransferDetailFamily extends Family<AsyncValue<TransferEntity>> {
  /// Provider para obtener una transferencia específica
  ///
  /// Copied from [TransferDetail].
  const TransferDetailFamily();

  /// Provider para obtener una transferencia específica
  ///
  /// Copied from [TransferDetail].
  TransferDetailProvider call(
    int transferId,
  ) {
    return TransferDetailProvider(
      transferId,
    );
  }

  @override
  TransferDetailProvider getProviderOverride(
    covariant TransferDetailProvider provider,
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
  String? get name => r'transferDetailProvider';
}

/// Provider para obtener una transferencia específica
///
/// Copied from [TransferDetail].
class TransferDetailProvider extends AutoDisposeAsyncNotifierProviderImpl<
    TransferDetail, TransferEntity> {
  /// Provider para obtener una transferencia específica
  ///
  /// Copied from [TransferDetail].
  TransferDetailProvider(
    int transferId,
  ) : this._internal(
          () => TransferDetail()..transferId = transferId,
          from: transferDetailProvider,
          name: r'transferDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$transferDetailHash,
          dependencies: TransferDetailFamily._dependencies,
          allTransitiveDependencies:
              TransferDetailFamily._allTransitiveDependencies,
          transferId: transferId,
        );

  TransferDetailProvider._internal(
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
  FutureOr<TransferEntity> runNotifierBuild(
    covariant TransferDetail notifier,
  ) {
    return notifier.build(
      transferId,
    );
  }

  @override
  Override overrideWith(TransferDetail Function() create) {
    return ProviderOverride(
      origin: this,
      override: TransferDetailProvider._internal(
        () => create()..transferId = transferId,
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
  AutoDisposeAsyncNotifierProviderElement<TransferDetail, TransferEntity>
      createElement() {
    return _TransferDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is TransferDetailProvider && other.transferId == transferId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, transferId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin TransferDetailRef on AutoDisposeAsyncNotifierProviderRef<TransferEntity> {
  /// The parameter `transferId` of this provider.
  int get transferId;
}

class _TransferDetailProviderElement
    extends AutoDisposeAsyncNotifierProviderElement<TransferDetail,
        TransferEntity> with TransferDetailRef {
  _TransferDetailProviderElement(super.provider);

  @override
  int get transferId => (origin as TransferDetailProvider).transferId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
