import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router/app_router.dart';
import '../providers/transfers_provider.dart';
import '../../domain/entities/transfer_entity.dart';

/// Pantalla de lista de transferencias
class TransfersListScreen extends ConsumerStatefulWidget {
  const TransfersListScreen({super.key});

  @override
  ConsumerState<TransfersListScreen> createState() =>
      _TransfersListScreenState();
}

class _TransfersListScreenState extends ConsumerState<TransfersListScreen> {
  String? _selectedFilter;

  @override
  Widget build(BuildContext context) {
    final transfersAsync = ref.watch(transfersProvider);
    final countsMap = ref.watch(transfersCountByStatusProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF1A2332),
      appBar: AppBar(
        backgroundColor: const Color(0xFF2A3544),
        title: const Text(
          'TRANSFERENCIAS',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list, color: Colors.white),
            onPressed: () => _showFilterDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Chips de resumen por estado
          _buildStatusChips(countsMap),

          // Lista de transferencias
          Expanded(
            child: transfersAsync.when(
              data: (transfers) {
                // Aplicar filtro si existe
                final filteredTransfers = _selectedFilter == null
                    ? transfers
                    : transfers
                        .where((t) => t.status == _selectedFilter)
                        .toList();

                if (filteredTransfers.isEmpty) {
                  return _buildEmptyState();
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    await ref.read(transfersProvider.notifier).refresh();
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredTransfers.length,
                    itemBuilder: (context, index) {
                      final transfer = filteredTransfers[index];
                      return _buildTransferCard(context, transfer);
                    },
                  ),
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(color: Colors.blue),
              ),
              error: (error, stack) => _buildErrorState(error.toString()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChips(Map<String, int> counts) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildStatusChip('TODOS', null, _getTotalCount(counts)),
            const SizedBox(width: 8),
            _buildStatusChip('PENDIENTE', 'PENDIENTE', counts['PENDIENTE'] ?? 0),
            const SizedBox(width: 8),
            _buildStatusChip(
                'EN TRÁNSITO', 'EN_TRANSITO', counts['EN_TRANSITO'] ?? 0),
            const SizedBox(width: 8),
            _buildStatusChip(
                'COMPLETADA', 'COMPLETADA', counts['COMPLETADA'] ?? 0),
            const SizedBox(width: 8),
            _buildStatusChip('CANCELADA', 'CANCELADA', counts['CANCELADA'] ?? 0),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String label, String? filter, int count) {
    final isSelected = _selectedFilter == filter;
    return FilterChip(
      label: Text('$label ($count)'),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = selected ? filter : null;
        });
      },
      backgroundColor: const Color(0xFF2A3544),
      selectedColor: Colors.blue.shade700,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.white70,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  int _getTotalCount(Map<String, int> counts) {
    return counts.values.fold(0, (sum, count) => sum + count);
  }

  Widget _buildTransferCard(BuildContext context, TransferEntity transfer) {
    return Card(
      color: const Color(0xFF2A3544),
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          context.push('${AppRoutes.transfers}/${transfer.id}');
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Código y Estado
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    transfer.transferCode,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  _buildStatusBadge(transfer.status),
                ],
              ),
              const SizedBox(height: 12),

              // Origen → Destino
              Row(
                children: [
                  const Icon(Icons.location_on, color: Colors.green, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      transfer.originWarehouse?.name ?? 'Almacén Origen',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.arrow_downward,
                      color: Colors.white54, size: 16),
                  const SizedBox(width: 12),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.location_on, color: Colors.red, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      transfer.destinationWarehouse?.name ?? 'Almacén Destino',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Footer: Fecha y otros detalles
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.calendar_today,
                          color: Colors.white54, size: 14),
                      const SizedBox(width: 6),
                      Text(
                        _formatDate(transfer.createdAt),
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  if (transfer.vehicle != null)
                    Row(
                      children: [
                        const Icon(Icons.local_shipping,
                            color: Colors.white54, size: 14),
                        const SizedBox(width: 6),
                        Text(
                          transfer.vehicle!.licensePlate,
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor = Colors.white;
    String label;

    switch (status.toUpperCase()) {
      case 'PENDIENTE':
        bgColor = Colors.orange.shade700;
        label = 'PENDIENTE';
        break;
      case 'EN_TRANSITO':
        bgColor = Colors.blue.shade700;
        label = 'EN TRÁNSITO';
        break;
      case 'COMPLETADA':
        bgColor = Colors.green.shade700;
        label = 'COMPLETADA';
        break;
      case 'CANCELADA':
        bgColor = Colors.red.shade700;
        label = 'CANCELADA';
        break;
      default:
        bgColor = Colors.grey.shade700;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox_outlined, size: 80, color: Colors.white24),
          const SizedBox(height: 16),
          Text(
            _selectedFilter == null
                ? 'No hay transferencias'
                : 'No hay transferencias con estado "$_selectedFilter"',
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 16,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 80, color: Colors.red),
          const SizedBox(height: 16),
          Text(
            'Error al cargar transferencias',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              error,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              ref.read(transfersProvider.notifier).refresh();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue.shade600,
            ),
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }

  void _showFilterDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2A3544),
        title: const Text(
          'Filtrar por estado',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildFilterOption(context, 'Todos', null),
            _buildFilterOption(context, 'Pendiente', 'PENDIENTE'),
            _buildFilterOption(context, 'En Tránsito', 'EN_TRANSITO'),
            _buildFilterOption(context, 'Completada', 'COMPLETADA'),
            _buildFilterOption(context, 'Cancelada', 'CANCELADA'),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterOption(BuildContext context, String label, String? value) {
    return ListTile(
      title: Text(
        label,
        style: const TextStyle(color: Colors.white),
      ),
      selected: _selectedFilter == value,
      onTap: () {
        setState(() {
          _selectedFilter = value;
        });
        Navigator.pop(context);
      },
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}
