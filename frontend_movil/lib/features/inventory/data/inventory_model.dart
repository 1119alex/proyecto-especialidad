/// Ítem de inventario de un almacén. Mapea `GET /warehouses/:id/inventory`.
/// El stock mínimo vive en el producto (`product.minStock`).
class InventoryItem {
  InventoryItem({
    required this.productId,
    required this.name,
    required this.sku,
    required this.unit,
    required this.quantity,
    required this.minStock,
  });

  final int productId;
  final String name;
  final String sku;
  final String unit;
  final double quantity;
  final int minStock;

  bool get lowStock => minStock > 0 && quantity < minStock;

  factory InventoryItem.fromJson(Map<String, dynamic> json) {
    final product = (json['product'] as Map<String, dynamic>?) ?? const {};
    return InventoryItem(
      productId: (json['productId'] ?? product['id'] ?? 0) as int,
      name: (product['name'] ?? 'Producto').toString(),
      sku: (product['sku'] ?? '').toString(),
      unit: (product['unit'] ?? '').toString(),
      quantity: double.tryParse(json['quantity']?.toString() ?? '0') ?? 0,
      minStock: int.tryParse(product['minStock']?.toString() ?? '0') ?? 0,
    );
  }
}
