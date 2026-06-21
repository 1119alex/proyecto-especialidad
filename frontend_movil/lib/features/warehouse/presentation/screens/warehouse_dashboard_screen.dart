import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/errors/error_messages.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/compact_transfer_tile.dart';
import '../../../transfers/presentation/providers/transfers_provider.dart';

/// Inicio del Encargado de almacén: KPIs operativos + salientes/entrantes.
class WarehouseDashboardScreen extends ConsumerStatefulWidget {
  const WarehouseDashboardScreen({super.key});

  @override
  ConsumerState<WarehouseDashboardScreen> createState() =>
      _WarehouseDashboardScreenState();
}

class _WarehouseDashboardScreenState
    extends ConsumerState<WarehouseDashboardScreen> {
  bool _outgoing = true; // true = salientes, false = entrantes

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = ref.watch(authProvider).value;
    final whId = auth?.warehouseId;
    final whName = auth?.warehouseName ?? 'Mi almacén';
    final async = ref.watch(transfersProvider);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.read(transfersProvider.notifier).refresh(),
          child: async.when(
            loading: () => const LoadingStateView(label: 'Cargando...'),
            error: (e, _) => _scrollable(
              ErrorStateView(
                message: friendlyError(e),
                onRetry: () => ref.read(transfersProvider.notifier).refresh(),
              ),
            ),
            data: (all) {
              final outgoing = all
                  .where((t) => t.originWarehouseId == whId)
                  .toList();
              final incoming = all
                  .where((t) => t.destinationWarehouseId == whId)
                  .toList();

              final porPreparar = outgoing
                  .where(
                    (t) =>
                        t.status == 'ASIGNADA' || t.status == 'EN_PREPARACION',
                  )
                  .length;
              final enCamino = outgoing
                  .where((t) => t.status == 'EN_TRANSITO')
                  .length;
              final porRecibir = incoming
                  .where(
                    (t) =>
                        t.status == 'EN_TRANSITO' ||
                        t.status == 'LLEGADA_DESTINO',
                  )
                  .length;

              final list = _outgoing ? outgoing : incoming;

              return CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(child: _header(theme, whName)),
                  SliverToBoxAdapter(
                    child: _kpis(porPreparar, enCamino, porRecibir),
                  ),
                  SliverToBoxAdapter(child: _segment()),
                  if (list.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: EmptyStateView(
                        title: _outgoing ? 'Sin salientes' : 'Sin entrantes',
                        message: _outgoing
                            ? 'No hay transferencias saliendo de tu almacén.'
                            : 'No hay transferencias llegando a tu almacén.',
                        icon: Icons.inbox_outlined,
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                      sliver: SliverList.separated(
                        itemCount: list.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 10),
                        itemBuilder: (_, i) =>
                            CompactTransferTile(transfer: list[i]),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _scrollable(Widget child) => SingleChildScrollView(
    physics: const AlwaysScrollableScrollPhysics(),
    child: SizedBox(height: 400, child: child),
  );

  Widget _header(ThemeData theme, String whName) {
    final c = theme.appColors;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 12, 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Almacén',
                  style: theme.textTheme.bodyMedium?.copyWith(color: c.muted),
                ),
                Text(
                  whName,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Alertas',
            onPressed: () => context.push(AppRoutes.alerts),
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
    );
  }

  Widget _kpis(int preparar, int camino, int recibir) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _KpiCard(
            value: preparar,
            label: 'Por preparar',
            tone: _KpiTone.warning,
          ),
          const SizedBox(width: 10),
          _KpiCard(value: camino, label: 'En camino', tone: _KpiTone.info),
          const SizedBox(width: 10),
          _KpiCard(
            value: recibir,
            label: 'Por recibir',
            tone: _KpiTone.success,
          ),
        ],
      ),
    );
  }

  Widget _segment() {
    final theme = Theme.of(context);
    final c = theme.appColors;
    Widget seg(String label, bool outgoing) {
      final active = _outgoing == outgoing;
      return Expanded(
        child: GestureDetector(
          onTap: () => setState(() => _outgoing = outgoing),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: active ? theme.colorScheme.surface : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: active ? theme.colorScheme.onSurface : c.muted,
              ),
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
      child: Container(
        padding: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          color: c.surfaceAlt,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [seg('Salientes', true), seg('Entrantes', false)]),
      ),
    );
  }
}

enum _KpiTone { warning, info, success }

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.value,
    required this.label,
    required this.tone,
  });

  final int value;
  final String label;
  final _KpiTone tone;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).appColors;
    final color = switch (tone) {
      _KpiTone.warning => c.warning,
      _KpiTone.info => Theme.of(context).colorScheme.primary,
      _KpiTone.success => c.success,
    };

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$value',
              style: TextStyle(
                color: color,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
