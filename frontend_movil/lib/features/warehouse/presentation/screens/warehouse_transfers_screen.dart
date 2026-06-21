import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/error_messages.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/compact_transfer_tile.dart';
import '../../../transfers/presentation/providers/transfers_provider.dart';

/// Pestaña "Transferencias" del encargado: todas las que involucran su almacén,
/// con filtro por dirección.
class WarehouseTransfersScreen extends ConsumerStatefulWidget {
  const WarehouseTransfersScreen({super.key});

  @override
  ConsumerState<WarehouseTransfersScreen> createState() =>
      _WarehouseTransfersScreenState();
}

class _WarehouseTransfersScreenState
    extends ConsumerState<WarehouseTransfersScreen> {
  int _filter = 0; // 0 todas, 1 salientes, 2 entrantes

  @override
  Widget build(BuildContext context) {
    final whId = ref.watch(authProvider).value?.warehouseId;
    final async = ref.watch(transfersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Transferencias')),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.read(transfersProvider.notifier).refresh(),
          child: async.when(
            loading: () => const LoadingStateView(label: 'Cargando...'),
            error: (e, _) => ErrorStateView(
              message: friendlyError(e),
              onRetry: () => ref.read(transfersProvider.notifier).refresh(),
            ),
            data: (all) {
              final mine = all
                  .where(
                    (t) =>
                        t.originWarehouseId == whId ||
                        t.destinationWarehouseId == whId,
                  )
                  .toList();
              final list = switch (_filter) {
                1 => mine.where((t) => t.originWarehouseId == whId).toList(),
                2 =>
                  mine.where((t) => t.destinationWarehouseId == whId).toList(),
                _ => mine,
              };

              return Column(
                children: [
                  _filters(),
                  Expanded(
                    child: list.isEmpty
                        ? const EmptyStateView(
                            title: 'Sin transferencias',
                            message: 'No hay transferencias para este filtro.',
                            icon: Icons.inbox_outlined,
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                            itemCount: list.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 10),
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

  Widget _filters() {
    const labels = ['Todas', 'Salientes', 'Entrantes'];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
      child: Row(
        children: [
          for (int i = 0; i < labels.length; i++) ...[
            ChoiceChip(
              label: Text(labels[i]),
              selected: _filter == i,
              onSelected: (_) => setState(() => _filter = i),
            ),
            if (i < labels.length - 1) const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}
