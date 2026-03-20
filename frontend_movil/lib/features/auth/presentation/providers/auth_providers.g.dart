// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$authRemoteDatasourceHash() =>
    r'c4665c150b821042975f0d86764899c34842b56c';

/// Provider del datasource remoto de auth
///
/// Copied from [authRemoteDatasource].
@ProviderFor(authRemoteDatasource)
final authRemoteDatasourceProvider =
    AutoDisposeProvider<AuthRemoteDatasource>.internal(
  authRemoteDatasource,
  name: r'authRemoteDatasourceProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$authRemoteDatasourceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef AuthRemoteDatasourceRef = AutoDisposeProviderRef<AuthRemoteDatasource>;
String _$authRepositoryHash() => r'1df1842dd3935fd5345bba13b72948951bb9975c';

/// Provider del repositorio de auth
///
/// Copied from [authRepository].
@ProviderFor(authRepository)
final authRepositoryProvider = AutoDisposeProvider<AuthRepository>.internal(
  authRepository,
  name: r'authRepositoryProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$authRepositoryHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef AuthRepositoryRef = AutoDisposeProviderRef<AuthRepository>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
