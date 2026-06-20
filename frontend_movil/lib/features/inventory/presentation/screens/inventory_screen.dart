import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../data/inventory_model.dart';
import '../providers/inventory_provider.dart';

/// Pestaña de Inventario del encargado: stock por producto + alerta de mínimo.
class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final warehouseId = ref.watch(authProvider).value?.warehouseId;

    if (warehouseId == null) {
      return const Scaffold(
        body: SafeArea(
          child: EmptyStateView(
            title: 'Sin almacén asignado',
            message: 'Tu usuario no tiene un almacén asociado.',
            icon: Icons.warehouse_outlined,
          ),
        ),
      );
    }

    final async = ref.watch(inventoryProvider(warehouseId));

    return Scaffold(
      appBar: AppBar(title: const Text('Inventario')),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async => ref.refresh(inventoryProvider(warehouseId)),
          child: async.when(
            loading: () =>
                const LoadingStateView(label: 'Cargando inventario...'),
            error: (e, _) => ErrorStateView(
              message: e.toString().replaceFirst('Exception: ', ''),
              onRetry: () => ref.refresh(inventoryProvider(warehouseId)),
            ),
            data: (items) {
              final lowCount = items.where((i) => i.lowStock).length;
              final filtered = _query.isEmpty
                  ? items
                  : items
                        .where(
                          (i) =>
                              i.name.toLowerCase().contains(_query) ||
                              i.sku.toLowerCase().contains(_query),
                        )
                        .toList();

              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                    child: TextField(
                      onChanged: (v) =>
                          setState(() => _query = v.trim().toLowerCase()),
                      decoration: const InputDecoration(
                        hintText: 'Buscar producto o SKU',
                        prefixIcon: Icon(Icons.search_rounded),
                      ),
                    ),
                  ),
                  if (lowCount > 0) _LowStockBanner(count: lowCount),
                  Expanded(
                    child: filtered.isEmpty
                        ? const EmptyStateView(
                            title: 'Sin resultados',
                            message: 'No hay productos que coincidan.',
                            icon: Icons.inventory_2_outlined,
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                            itemCount: filtered.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 10),
                            itemBuilder: (_, i) =>
                                _InventoryRow(item: filtered[i]),
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

class _LowStockBanner extends StatelessWidget {
  const _LowStockBanner({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).appColors;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: c.danger.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.danger.withValues(alpha: 0.45)),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: c.danger, size: 18),
          const SizedBox(width: 10),
          Text(
            count == 1
                ? '1 producto bajo el mínimo'
                : '$count productos bajo el mínimo',
            style: TextStyle(
              color: c.danger,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _InventoryRow extends StatelessWidget {
  const _InventoryRow({required this.item});
  final InventoryItem item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    final low = item.lowStock;
    final qtyColor = low ? c.danger : c.success;

    String fmtQty(double q) =>
        q == q.roundToDouble() ? q.toInt().toString() : q.toString();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: low
              ? c.danger.withValues(alpha: 0.45)
              : theme.colorScheme.outline,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'SKU ${item.sku} · mín. ${item.minStock}',
                  style: theme.textTheme.bodySmall?.copyWith(color: c.muted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                fmtQty(item.quantity),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: qtyColor,
                ),
              ),
              Text(
                item.unit,
                style: theme.textTheme.bodySmall?.copyWith(color: c.muted),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
