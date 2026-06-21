import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/errors/error_messages.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/transfer_status_style.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../providers/transfers_provider.dart';
import 'reception_sheet.dart';
import '../../domain/entities/transfer_entity.dart';

/// Abre el detalle de una transferencia como panel deslizable (in-place),
/// sobre la pestaña actual. Reemplaza la navegación a una pantalla aparte.
Future<void> showTransferDetailSheet(BuildContext context, int transferId) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => TransferDetailSheet(transferId: transferId),
  );
}

class TransferDetailSheet extends ConsumerWidget {
  const TransferDetailSheet({super.key, required this.transferId});

  final int transferId;

  static const _flow = [
    'ASIGNADA',
    'EN_PREPARACION',
    'LISTA_DESPACHO',
    'EN_TRANSITO',
    'LLEGADA_DESTINO',
    'COMPLETADA',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final transferAsync = ref.watch(transferDetailProvider(transferId));

    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              const _GrabHandle(),
              Expanded(
                child: transferAsync.when(
                  data: (t) => _content(context, ref, t, scrollController),
                  loading: () => const LoadingStateView(label: 'Cargando...'),
                  error: (e, _) => ErrorStateView(
                    title: 'No se pudo cargar',
                    message: friendlyError(e),
                    onRetry: () => ref
                        .read(transferDetailProvider(transferId).notifier)
                        .refresh(),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _content(
    BuildContext context,
    WidgetRef ref,
    TransferEntity t,
    ScrollController controller,
  ) {
    final theme = Theme.of(context);
    return ListView(
      controller: controller,
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                t.transferCode,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            StatusBadge(t.status),
          ],
        ),
        const SizedBox(height: 20),
        _RouteCard(transfer: t),
        const SizedBox(height: 14),
        _TimelineCard(transfer: t, flow: _flow),
        if (t.vehicle != null || t.driver != null) ...[
          const SizedBox(height: 14),
          _VehicleDriverCard(transfer: t),
        ],
        if (t.details != null && t.details!.isNotEmpty) ...[
          const SizedBox(height: 14),
          _ProductsCard(transfer: t),
        ],
        if (t.notes != null && t.notes!.isNotEmpty) ...[
          const SizedBox(height: 14),
          _SheetSection(
            title: 'Notas',
            child: Text(t.notes!, style: theme.textTheme.bodyMedium),
          ),
        ],
        const SizedBox(height: 20),
        ..._actions(context, ref, t),
      ],
    );
  }

  // ===================== ACCIONES =====================

  List<Widget> _actions(BuildContext context, WidgetRef ref, TransferEntity t) {
    final auth = ref.read(authProvider).value;
    final role = auth?.userRole;
    final warehouseId = auth?.warehouseId;
    final buttons = <Widget>[];

    Future<void> refreshAfter(Future<Object?> nav) async {
      await nav;
      ref.read(transferDetailProvider(transferId).notifier).refresh();
      ref.invalidate(transfersProvider);
    }

    if (role == AppConstants.roleEncargadoAlmacen) {
      if (warehouseId == t.originWarehouseId) {
        if (t.status == 'ASIGNADA') {
          buttons.add(
            _SheetButton(
              label: 'Iniciar preparación',
              icon: Icons.inventory_2_outlined,
              onPressed: () => _startPreparation(context, ref),
            ),
          );
        }
        if (t.status == 'EN_PREPARACION' || t.status == 'LISTA_DESPACHO') {
          buttons.add(
            _SheetButton(
              label: 'Mostrar código QR',
              icon: Icons.qr_code_2_rounded,
              onPressed: () => _openQrDisplay(context, t),
            ),
          );
        }
      }
      if (warehouseId == t.destinationWarehouseId &&
          t.status == 'LLEGADA_DESTINO') {
        if (t.qrVerifiedAtDestination == null) {
          buttons.add(
            _SheetButton(
              label: 'Escanear QR y recibir',
              icon: Icons.qr_code_scanner_rounded,
              onPressed: () => refreshAfter(
                context.push(
                  AppRoutes.qrScanner,
                  extra: {'transferId': t.id, 'location': 'destination'},
                ),
              ),
            ),
          );
        } else {
          buttons.add(
            _SheetButton(
              label: 'Confirmar recepción',
              icon: Icons.fact_check_outlined,
              onPressed: () => refreshAfter(
                showReceptionSheet(
                  context,
                  transferId: t.id,
                  transferCode: t.transferCode,
                  originName: t.originWarehouse?.name,
                  destinationName: t.destinationWarehouse?.name,
                ),
              ),
            ),
          );
        }
      }
    }

    if (role == AppConstants.roleTransportista) {
      if (t.status == 'LISTA_DESPACHO') {
        buttons.add(
          _SheetButton(
            label: 'Escanear QR · recoger carga',
            icon: Icons.qr_code_scanner_rounded,
            onPressed: () => refreshAfter(
              context.push(
                AppRoutes.qrScanner,
                extra: {'transferId': t.id, 'location': 'origin'},
              ),
            ),
          ),
        );
      }
      if (t.status == 'EN_TRANSITO') {
        buttons.add(
          _SheetButton(
            label: 'Ver seguimiento GPS',
            icon: Icons.navigation_rounded,
            onPressed: () => context.push(
              AppRoutes.gpsTracking,
              extra: {
                'transferId': t.id,
                'transferCode': t.transferCode,
                'status': t.status,
              },
            ),
          ),
        );
      }
      if (t.status == 'LLEGADA_DESTINO') {
        buttons.add(
          _SheetButton(
            label: 'Mostrar QR para entrega',
            icon: Icons.qr_code_2_rounded,
            onPressed: () => _openQrDisplay(context, t),
          ),
        );
      }
    }

    if (buttons.isEmpty) return const [];
    return [
      for (final b in buttons)
        Padding(padding: const EdgeInsets.only(bottom: 10), child: b),
    ];
  }

  void _openQrDisplay(BuildContext context, TransferEntity t) {
    context.push(
      AppRoutes.qrDisplay,
      extra: {
        'transferId': t.id,
        'transferCode': t.transferCode,
        'originName': t.originWarehouse?.name ?? 'Origen',
        'destinationName': t.destinationWarehouse?.name ?? 'Destino',
        'totalProducts': t.details?.length ?? 0,
      },
    );
  }

  Future<void> _startPreparation(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Iniciar preparación'),
        content: const Text(
          'Se generará el código QR para el transportista. ¿Continuar?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Iniciar'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await ref
          .read(transferDetailProvider(transferId).notifier)
          .startPreparation();
      ref.invalidate(transfersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(
              content: Text('Preparación iniciada. Ya puedes mostrar el QR.'),
            ),
          );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text(e.toString().replaceFirst('Exception: ', '')),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
      }
    }
  }
}

// ===================== SUBWIDGETS =====================

class _GrabHandle extends StatelessWidget {
  const _GrabHandle();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10, bottom: 6),
      child: Container(
        width: 40,
        height: 4,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.outline,
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }
}

class _SheetSection extends StatelessWidget {
  const _SheetSection({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.appColors.surfaceAlt,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.appColors.muted,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _RouteCard extends StatelessWidget {
  const _RouteCard({required this.transfer});
  final TransferEntity transfer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    return _SheetSection(
      title: 'Ruta',
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Icon(Icons.trip_origin, color: c.success, size: 20),
              Container(width: 2, height: 34, color: theme.colorScheme.outline),
              Icon(Icons.location_on, color: c.danger, size: 20),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transfer.originWarehouse?.name ?? 'Almacén origen',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (transfer.originWarehouse?.address != null)
                  Text(
                    transfer.originWarehouse!.address!,
                    style: theme.textTheme.bodySmall?.copyWith(color: c.muted),
                  ),
                const SizedBox(height: 18),
                Text(
                  transfer.destinationWarehouse?.name ?? 'Almacén destino',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (transfer.destinationWarehouse?.address != null)
                  Text(
                    transfer.destinationWarehouse!.address!,
                    style: theme.textTheme.bodySmall?.copyWith(color: c.muted),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TimelineCard extends StatelessWidget {
  const _TimelineCard({required this.transfer, required this.flow});
  final TransferEntity transfer;
  final List<String> flow;

  String? _timeFor(String step) {
    DateTime? d;
    switch (step) {
      case 'ASIGNADA':
        d = transfer.createdAt;
        break;
      case 'EN_TRANSITO':
        d = transfer.actualDepartureTime;
        break;
      case 'LLEGADA_DESTINO':
        d = transfer.actualArrivalTime;
        break;
      case 'COMPLETADA':
        d = transfer.completedAt;
        break;
    }
    if (d == null) return null;
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(d.day)}/${two(d.month)} ${two(d.hour)}:${two(d.minute)}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;

    if (transfer.status == 'CANCELADA') {
      return _SheetSection(
        title: 'Estado',
        child: Row(
          children: [
            Icon(Icons.cancel_outlined, color: c.danger, size: 20),
            const SizedBox(width: 10),
            Text(
              'Transferencia cancelada',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    final currentIndex = flow.indexOf(transfer.status);

    return _SheetSection(
      title: 'Progreso',
      child: Column(
        children: [
          for (int i = 0; i < flow.length; i++)
            _step(
              context,
              style: TransferStatusStyle.of(flow[i]),
              done: i <= currentIndex,
              current: i == currentIndex,
              time: _timeFor(flow[i]),
              isLast: i == flow.length - 1,
            ),
        ],
      ),
    );
  }

  Widget _step(
    BuildContext context, {
    required TransferStatusStyle style,
    required bool done,
    required bool current,
    required String? time,
    required bool isLast,
  }) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    final color = done ? c.success : theme.colorScheme.outline;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Icon(
              done ? Icons.check_circle : Icons.circle_outlined,
              size: 18,
              color: done ? c.success : c.muted,
            ),
            if (!isLast) Container(width: 2, height: 22, color: color),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    style.label,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: current ? FontWeight.w700 : FontWeight.w500,
                      color: done ? theme.colorScheme.onSurface : c.muted,
                    ),
                  ),
                ),
                if (time != null)
                  Text(
                    time,
                    style: theme.textTheme.bodySmall?.copyWith(color: c.muted),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _VehicleDriverCard extends StatelessWidget {
  const _VehicleDriverCard({required this.transfer});
  final TransferEntity transfer;

  @override
  Widget build(BuildContext context) {
    return _SheetSection(
      title: 'Vehículo y conductor',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (transfer.vehicle != null)
            _InfoRow(
              icon: Icons.local_shipping_outlined,
              label: 'Vehículo',
              value:
                  '${transfer.vehicle!.licensePlate} · ${transfer.vehicle!.type}',
            ),
          if (transfer.driver != null) ...[
            const SizedBox(height: 10),
            _InfoRow(
              icon: Icons.person_outline,
              label: 'Conductor',
              value: transfer.driver!.name,
            ),
          ],
        ],
      ),
    );
  }
}

class _ProductsCard extends StatelessWidget {
  const _ProductsCard({required this.transfer});
  final TransferEntity transfer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    return _SheetSection(
      title: 'Productos (${transfer.details!.length})',
      child: Column(
        children: [
          for (final d in transfer.details!)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.inventory_2_outlined,
                    size: 18,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          d.productName,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          'SKU ${d.productSku} · ${d.quantityExpected} ${d.unit}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: c.muted,
                          ),
                        ),
                        if (d.quantityReceived != null)
                          Text(
                            'Recibido: ${d.quantityReceived} ${d.unit}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: d.hasDiscrepancy ? c.warning : c.success,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    return Row(
      children: [
        Icon(icon, size: 18, color: c.muted),
        const SizedBox(width: 10),
        Text(
          '$label: ',
          style: theme.textTheme.bodyMedium?.copyWith(color: c.muted),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _SheetButton extends StatelessWidget {
  const _SheetButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });
  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 20),
        label: Text(label),
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
      ),
    );
  }
}
