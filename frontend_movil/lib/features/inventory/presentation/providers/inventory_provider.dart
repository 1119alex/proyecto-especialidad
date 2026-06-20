import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../services/api/api_client_provider.dart';
import '../../data/inventory_model.dart';

/// Inventario de un almacén (por id). `GET /warehouses/:id/inventory`.
final inventoryProvider = FutureProvider.family<List<InventoryItem>, int>((
  ref,
  warehouseId,
) async {
  final res = await ref
      .read(apiClientProvider)
      .get('/warehouses/$warehouseId/inventory');
  final data = (res.data as List).cast<Map<String, dynamic>>();
  return data.map(InventoryItem.fromJson).toList();
});
