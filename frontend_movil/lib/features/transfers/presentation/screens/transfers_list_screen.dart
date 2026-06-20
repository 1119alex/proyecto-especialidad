import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/transfer_status_style.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../shared/providers/connectivity_provider.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../providers/transfers_provider.dart';
import '../widgets/transfer_detail_sheet.dart';
import '../../domain/entities/transfer_entity.dart';

/// Pantalla principal: lista de viajes/transferencias del usuario.
class TransfersListScreen extends ConsumerWidget {
  const TransfersListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transfersAsync = ref.watch(transfersProvider);
    final authState = ref.watch(authProvider);
    final userName = authState.value?.userName ?? 'Usuario';
    final userRole =
        authState.value?.userRole ?? AppConstants.roleTransportista;
    final isOnline = ref.watch(connectivityStateProvider).value ?? true;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.read(transfersProvider.notifier).refresh(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(child: _Header(userName: userName)),
              if (!isOnline) const SliverToBoxAdapter(child: _OfflineBanner()),
              SliverToBoxAdapter(
                child: _ActiveTrip(transfersAsync: transfersAsync),
              ),
              SliverToBoxAdapter(
                child: _SectionTitle(transfersAsync: transfersAsync),
              ),
              transfersAsync.when(
                data: (transfers) {
                  if (transfers.isEmpty) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: EmptyStateView(
                        title: 'No tienes viajes',
                        message:
                            'Cuando te asignen una transferencia aparecerá aquí.',
                        icon: Icons.local_shipping_outlined,
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                    sliver: SliverList.separated(
                      itemCount: transfers.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, i) => _TransferCard(
                        transfer: transfers[i],
                        userRole: userRole,
                      ),
                    ),
                  );
                },
                loading: () => const SliverFillRemaining(
                  hasScrollBody: false,
                  child: LoadingStateView(label: 'Cargando viajes...'),
                ),
                error: (error, _) => SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorStateView(
                    title: 'No se pudieron cargar tus viajes',
                    message: _humanizeError(error),
                    onRetry: () =>
                        ref.read(transfersProvider.notifier).refresh(),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _humanizeError(Object error) {
    final msg = error.toString().replaceFirst('Exception: ', '');
    return msg.isEmpty ? 'Ocurrió un error inesperado.' : msg;
  }
}

// ============================ HEADER ============================

class _Header extends ConsumerWidget {
  const _Header({required this.userName});
  final String userName;

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cerrar sesión'),
        content: const Text('¿Seguro que deseas cerrar sesión?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            child: const Text('Cerrar sesión'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      await ref.read(authProvider.notifier).logout();
      if (context.mounted) context.go(AppRoutes.login);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final first = userName.trim().isEmpty
        ? 'Usuario'
        : userName.trim().split(' ').first;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 12, 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hola,',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.appColors.muted,
                  ),
                ),
                Text(
                  first,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Cerrar sesión',
            onPressed: () => _confirmLogout(context, ref),
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
    );
  }
}

// ========================= OFFLINE BANNER =========================

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner();

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).appColors;
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: c.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.warning.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Icon(Icons.cloud_off_rounded, color: c.warning, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Sin conexión — mostrando datos guardados.',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ========================== ACTIVE TRIP ==========================

class _ActiveTrip extends StatelessWidget {
  const _ActiveTrip({required this.transfersAsync});
  final AsyncValue<List<TransferEntity>> transfersAsync;

  @override
  Widget build(BuildContext context) {
    return transfersAsync.maybeWhen(
      data: (transfers) {
        TransferEntity? active;
        for (final t in transfers) {
          if (t.status == 'EN_TRANSITO') {
            active = t;
            break;
          }
        }
        active ??= transfers.where((t) => t.status == 'LISTA_DESPACHO').isEmpty
            ? null
            : transfers.firstWhere((t) => t.status == 'LISTA_DESPACHO');
        if (active == null) return const SizedBox.shrink();
        return _ActiveTripCard(transfer: active);
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}

class _ActiveTripCard extends StatelessWidget {
  const _ActiveTripCard({required this.transfer});
  final TransferEntity transfer;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final style = TransferStatusStyle.of(transfer.status);
    final isTransit = transfer.status == 'EN_TRANSITO';

    final place = isTransit
        ? transfer.destinationWarehouse?.name
        : transfer.originWarehouse?.name;
    final placeLabel = isTransit ? 'Destino' : 'Recoger en';
    final ctaLabel = isTransit ? 'Ver en el mapa' : 'Escanear QR y recoger';
    final ctaIcon = isTransit
        ? Icons.map_rounded
        : Icons.qr_code_scanner_rounded;

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 8, 20, 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [scheme.primary, scheme.secondary],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: scheme.primary.withValues(alpha: 0.30),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(style.icon, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isTransit ? 'VIAJE ACTIVO' : 'LISTO PARA RECOGER',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      transfer.transferCode,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            placeLabel,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 2),
          Text(
            place ?? 'N/A',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                if (isTransit) {
                  context.push(
                    AppRoutes.gpsTracking,
                    extra: {
                      'transferId': transfer.id,
                      'transferCode': transfer.transferCode,
                      'status': transfer.status,
                    },
                  );
                } else {
                  context.push(
                    AppRoutes.qrScanner,
                    extra: {'transferId': transfer.id, 'location': 'origin'},
                  );
                }
              },
              icon: Icon(ctaIcon, size: 20),
              label: Text(ctaLabel),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: scheme.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ========================= SECTION TITLE =========================

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.transfersAsync});
  final AsyncValue<List<TransferEntity>> transfersAsync;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final count = transfersAsync.maybeWhen(
      data: (t) => t.length,
      orElse: () => null,
    );

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Mis viajes',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          if (count != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                '$count ${count == 1 ? 'viaje' : 'viajes'}',
                style: TextStyle(
                  color: theme.colorScheme.onPrimaryContainer,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ========================= TRANSFER CARD =========================

class _TransferCard extends ConsumerWidget {
  const _TransferCard({required this.transfer, required this.userRole});
  final TransferEntity transfer;
  final String userRole;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    final style = TransferStatusStyle.of(transfer.status);

    return Material(
      color: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => showTransferDetailSheet(context, transfer.id),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: theme.colorScheme.outline),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(13),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(width: 4, color: style.base),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Flexible(
                                child: Text(
                                  transfer.transferCode,
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              StatusBadge(transfer.status, dense: true),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _PlaceRow(
                            icon: Icons.trip_origin,
                            iconColor: c.danger,
                            label:
                                transfer.originWarehouse?.name ??
                                'Almacén origen',
                          ),
                          const SizedBox(height: 6),
                          _PlaceRow(
                            icon: Icons.warehouse_outlined,
                            iconColor: c.muted,
                            label:
                                transfer.destinationWarehouse?.name ??
                                'Almacén destino',
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Icon(
                                Icons.access_time_rounded,
                                size: 15,
                                color: c.muted,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                _formatDateTime(transfer.createdAt),
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: c.muted,
                                ),
                              ),
                            ],
                          ),
                          ..._actions(context, ref),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _actions(BuildContext context, WidgetRef ref) {
    final buttons = <Widget>[];

    if (userRole == AppConstants.roleEncargadoAlmacen) {
      if (transfer.status == 'EN_PREPARACION') {
        buttons.add(
          _ActionButton(
            label: 'Mostrar QR',
            icon: Icons.qr_code_2_rounded,
            onPressed: () => context.push(
              AppRoutes.qrDisplay,
              extra: {
                'transferId': transfer.id,
                'transferCode': transfer.transferCode,
                'originName': transfer.originWarehouse?.name ?? 'N/A',
                'destinationName': transfer.destinationWarehouse?.name ?? 'N/A',
                'totalProducts': transfer.details?.length ?? 0,
              },
            ),
          ),
        );
      }
      if (transfer.status == 'LLEGADA_DESTINO') {
        buttons.add(
          _ActionButton(
            label: 'Escanear QR',
            icon: Icons.qr_code_scanner_rounded,
            onPressed: () => context.push(
              AppRoutes.qrScanner,
              extra: {'transferId': transfer.id, 'location': 'destination'},
            ),
          ),
        );
      }
    }

    if (userRole == AppConstants.roleTransportista) {
      if (transfer.status == 'LISTA_DESPACHO') {
        buttons.add(
          _ActionButton(
            label: 'Escanear QR origen',
            icon: Icons.qr_code_scanner_rounded,
            onPressed: () => context.push(
              AppRoutes.qrScanner,
              extra: {'transferId': transfer.id, 'location': 'origin'},
            ),
          ),
        );
      }
      if (transfer.status == 'EN_TRANSITO') {
        buttons.add(
          _ActionButton(
            label: 'Seguimiento GPS',
            icon: Icons.navigation_rounded,
            onPressed: () => context.push(
              AppRoutes.gpsTracking,
              extra: {
                'transferId': transfer.id,
                'transferCode': transfer.transferCode,
                'status': transfer.status,
              },
            ),
          ),
        );
      }
    }

    if (buttons.isEmpty) return const [];
    return [
      const SizedBox(height: 14),
      Divider(height: 1, color: Theme.of(context).colorScheme.outline),
      const SizedBox(height: 12),
      Wrap(spacing: 8, runSpacing: 8, children: buttons),
    ];
  }

  String _formatDateTime(DateTime d) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(d.day)}/${two(d.month)} · ${two(d.hour)}:${two(d.minute)}';
  }
}

class _PlaceRow extends StatelessWidget {
  const _PlaceRow({
    required this.icon,
    required this.iconColor,
    required this.label,
  });
  final IconData icon;
  final Color iconColor;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 17, color: iconColor),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.appColors.muted,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });
  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SizedBox(
      height: 40,
      child: FilledButton.tonalIcon(
        onPressed: onPressed,
        icon: Icon(icon, size: 18),
        label: Text(label, style: const TextStyle(fontSize: 13)),
        style: FilledButton.styleFrom(
          backgroundColor: scheme.primaryContainer,
          foregroundColor: scheme.onPrimaryContainer,
          minimumSize: const Size(0, 40),
          padding: const EdgeInsets.symmetric(horizontal: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
    );
  }
}
