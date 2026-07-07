import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/error_messages.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/transfer_status_style.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../domain/entities/transfer_entity.dart';
import '../providers/transfers_provider.dart';
import '../widgets/transfer_detail_sheet.dart';

/// Estados terminales que componen el historial de viajes.
const _terminalStates = {
  'COMPLETADA',
  'COMPLETADA_CON_DISCREPANCIA',
  'CANCELADA',
};

enum _HistoryFilter { todas, completadas, canceladas }

/// Pestaña "Viajes" del transportista: historial de viajes finalizados.
class TripHistoryScreen extends ConsumerStatefulWidget {
  const TripHistoryScreen({super.key});

  @override
  ConsumerState<TripHistoryScreen> createState() => _TripHistoryScreenState();
}

class _TripHistoryScreenState extends ConsumerState<TripHistoryScreen> {
  _HistoryFilter _filter = _HistoryFilter.todas;

  bool _matches(TransferEntity t) {
    switch (_filter) {
      case _HistoryFilter.todas:
        return _terminalStates.contains(t.status.toUpperCase());
      case _HistoryFilter.completadas:
        return t.status.toUpperCase().startsWith('COMPLETADA');
      case _HistoryFilter.canceladas:
        return t.status.toUpperCase() == 'CANCELADA';
    }
  }

  /// Fecha por la que se ordena/etiqueta cada viaje finalizado.
  DateTime _closedAt(TransferEntity t) =>
      t.completedAt ?? t.cancelledAt ?? t.updatedAt;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(transfersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Viajes')),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.read(transfersProvider.notifier).refresh(),
          child: async.when(
            loading: () => const LoadingStateView(label: 'Cargando historial...'),
            error: (e, _) => ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.7,
                  child: ErrorStateView(
                    title: 'No se pudo cargar el historial',
                    message: friendlyError(e),
                    onRetry: () =>
                        ref.read(transfersProvider.notifier).refresh(),
                  ),
                ),
              ],
            ),
            data: (transfers) {
              final history = transfers.where(_matches).toList()
                ..sort((a, b) => _closedAt(b).compareTo(_closedAt(a)));

              return Column(
                children: [
                  _FilterBar(
                    filter: _filter,
                    onChanged: (f) => setState(() => _filter = f),
                  ),
                  Expanded(
                    child: history.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              SizedBox(
                                height: MediaQuery.of(context).size.height * 0.6,
                                child: const EmptyStateView(
                                  title: 'Sin viajes finalizados',
                                  message:
                                      'Cuando completes o se cancele un viaje, '
                                      'aparecerá aquí tu historial.',
                                  icon: Icons.history_rounded,
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                            itemCount: history.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (_, i) => _HistoryCard(
                              transfer: history[i],
                              closedAt: _closedAt(history[i]),
                            ),
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
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({required this.filter, required this.onChanged});
  final _HistoryFilter filter;
  final ValueChanged<_HistoryFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: Row(
        children: [
          _chip(context, 'Todas', _HistoryFilter.todas),
          const SizedBox(width: 8),
          _chip(context, 'Completadas', _HistoryFilter.completadas),
          const SizedBox(width: 8),
          _chip(context, 'Canceladas', _HistoryFilter.canceladas),
        ],
      ),
    );
  }

  Widget _chip(BuildContext context, String label, _HistoryFilter value) {
    final selected = filter == value;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onChanged(value),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.transfer, required this.closedAt});
  final TransferEntity transfer;
  final DateTime closedAt;

  @override
  Widget build(BuildContext context) {
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
                          Row(
                            children: [
                              Icon(Icons.trip_origin, size: 16, color: c.danger),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  transfer.originWarehouse?.name ?? 'Origen',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: c.muted,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(
                                Icons.warehouse_outlined,
                                size: 16,
                                color: c.muted,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  transfer.destinationWarehouse?.name ??
                                      'Destino',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: c.muted,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Icon(
                                Icons.event_available_rounded,
                                size: 15,
                                color: c.muted,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                _fmtDate(closedAt),
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: c.muted,
                                ),
                              ),
                              if (transfer.details != null) ...[
                                const Spacer(),
                                Icon(
                                  Icons.inventory_2_outlined,
                                  size: 15,
                                  color: c.muted,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '${transfer.details!.length} ítems',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: c.muted,
                                  ),
                                ),
                              ],
                            ],
                          ),
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

  String _fmtDate(DateTime d) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(d.day)}/${two(d.month)}/${d.year} · ${two(d.hour)}:${two(d.minute)}';
  }
}
