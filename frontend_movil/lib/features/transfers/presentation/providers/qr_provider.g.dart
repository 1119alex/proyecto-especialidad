// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'qr_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$qrDatasourceHash() => r'48eefad27a673f8731b4264eb3f509a77af3dd6b';

/// Provider del datasource de QR
///
/// Copied from [qrDatasource].
@ProviderFor(qrDatasource)
final qrDatasourceProvider = AutoDisposeProvider<QRRemoteDatasource>.internal(
  qrDatasource,
  name: r'qrDatasourceProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$qrDatasourceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef QrDatasourceRef = AutoDisposeProviderRef<QRRemoteDatasource>;
String _$transferQRHash() => r'9eb589c6db31fc1f26b6103f014e2e3e8052ef3d';

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

/// Provider para obtener/generar QR de una transferencia
///
/// Copied from [transferQR].
@ProviderFor(transferQR)
const transferQRProvider = TransferQRFamily();

/// Provider para obtener/generar QR de una transferencia
///
/// Copied from [transferQR].
class TransferQRFamily extends Family<AsyncValue<QRResponseModel>> {
  /// Provider para obtener/generar QR de una transferencia
  ///
  /// Copied from [transferQR].
  const TransferQRFamily();

  /// Provider para obtener/generar QR de una transferencia
  ///
  /// Copied from [transferQR].
  TransferQRProvider call(
    int transferId,
  ) {
    return TransferQRProvider(
      transferId,
    );
  }

  @override
  TransferQRProvider getProviderOverride(
    covariant TransferQRProvider provider,
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
  String? get name => r'transferQRProvider';
}

/// Provider para obtener/generar QR de una transferencia
///
/// Copied from [transferQR].
class TransferQRProvider extends AutoDisposeFutureProvider<QRResponseModel> {
  /// Provider para obtener/generar QR de una transferencia
  ///
  /// Copied from [transferQR].
  TransferQRProvider(
    int transferId,
  ) : this._internal(
          (ref) => transferQR(
            ref as TransferQRRef,
            transferId,
          ),
          from: transferQRProvider,
          name: r'transferQRProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$transferQRHash,
          dependencies: TransferQRFamily._dependencies,
          allTransitiveDependencies:
              TransferQRFamily._allTransitiveDependencies,
          transferId: transferId,
        );

  TransferQRProvider._internal(
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
    FutureOr<QRResponseModel> Function(TransferQRRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: TransferQRProvider._internal(
        (ref) => create(ref as TransferQRRef),
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
  AutoDisposeFutureProviderElement<QRResponseModel> createElement() {
    return _TransferQRProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is TransferQRProvider && other.transferId == transferId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, transferId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin TransferQRRef on AutoDisposeFutureProviderRef<QRResponseModel> {
  /// The parameter `transferId` of this provider.
  int get transferId;
}

class _TransferQRProviderElement
    extends AutoDisposeFutureProviderElement<QRResponseModel>
    with TransferQRRef {
  _TransferQRProviderElement(super.provider);

  @override
  int get transferId => (origin as TransferQRProvider).transferId;
}

String _$qRVerifierHash() => r'3a1beb26d6c516410810e7ff1d7c215460e2b96a';

/// Provider para verificar QR
///
/// Copied from [QRVerifier].
@ProviderFor(QRVerifier)
final qRVerifierProvider = AutoDisposeAsyncNotifierProvider<QRVerifier,
    QRVerifyResponseModel?>.internal(
  QRVerifier.new,
  name: r'qRVerifierProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$qRVerifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$QRVerifier = AutoDisposeAsyncNotifier<QRVerifyResponseModel?>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
