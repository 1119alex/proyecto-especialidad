import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/transfers_provider.dart';

class ReceptionScreen extends ConsumerStatefulWidget {
  final int transferId;
  final String transferCode;
  final String originName;
  final String destinationName;

  const ReceptionScreen({
    super.key,
    required this.transferId,
    required this.transferCode,
    required this.originName,
    required this.destinationName,
  });

  @override
  ConsumerState<ReceptionScreen> createState() => _ReceptionScreenState();
}

class _ReceptionScreenState extends ConsumerState<ReceptionScreen> {
  final Map<int, TextEditingController> _quantityControllers = {};
  final List<ProductReception> products = [];
  bool isLoading = true;
  bool isSubmitting = false;
  String? loadError;

  @override
  void initState() {
    super.initState();
    _loadTransferDetails();
  }

  @override
  void dispose() {
    for (var controller in _quantityControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadTransferDetails() async {
    setState(() {
      isLoading = true;
      loadError = null;
    });

    try {
      final repository = ref.read(transfersRepositoryProvider);
      final transfer = await repository.getTransferById(widget.transferId);

      if (!mounted) return;

      setState(() {
        products.clear();
        for (final detail in transfer.details ?? []) {
          products.add(ProductReception(
            productId: detail.productId,
            sku: detail.productSku,
            name: detail.productName,
            expectedQuantity: detail.quantityExpected,
            receivedQuantity: detail.quantityExpected,
            hasDiscrepancy: false,
          ));
        }

        for (var product in products) {
          _quantityControllers[product.productId] = TextEditingController(
            text: _formatQty(product.receivedQuantity),
          );
        }

        isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isLoading = false;
        loadError = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  void _updateReceivedQuantity(int productId, double quantity) {
    setState(() {
      final index = products.indexWhere((p) => p.productId == productId);
      if (index != -1) {
        products[index] = products[index].copyWith(
          receivedQuantity: quantity,
          hasDiscrepancy: quantity != products[index].expectedQuantity,
        );
      }
    });
  }

  bool get _hasDiscrepancies => products.any((p) => p.hasDiscrepancy);

  Future<void> _confirmReception() async {
    if (isSubmitting) return;

    // Confirmación adicional cuando hay diferencias
    if (_hasDiscrepancies) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Discrepancias detectadas'),
          content: const Text(
            'Hay diferencias entre lo enviado y lo recibido. '
            'La transferencia se cerrará como "Completada con discrepancia" '
            'y se notificará al administrador. ¿Desea continuar?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Revisar de nuevo'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFBBF24),
              ),
              child: const Text('Confirmar con discrepancias'),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }

    setState(() {
      isSubmitting = true;
    });

    try {
      final receivedQuantities = products
          .map((p) => {
                'productId': p.productId,
                'quantity': p.receivedQuantity,
              })
          .toList();

      await ref
          .read(transferDetailProvider(widget.transferId).notifier)
          .completeReception(receivedQuantities);

      if (!mounted) return;

      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Recepción Confirmada'),
          content: Text(
            _hasDiscrepancies
                ? 'La recepción fue registrada con discrepancias. '
                    'El inventario de ambos almacenes fue actualizado.'
                : 'La recepción de la carga ha sido confirmada exitosamente. '
                    'El inventario de ambos almacenes fue actualizado.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Aceptar'),
            ),
          ],
        ),
      );

      if (mounted) {
        context.go('/');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isSubmitting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e.toString().replaceAll('Exception: ', ''),
            style: const TextStyle(fontSize: 15),
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1E293B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).canPop()
              ? Navigator.of(context).pop()
              : context.go('/'),
        ),
        title: const Text(
          'Recepción de Carga',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF3B82F6)),
            )
          : loadError != null
              ? _buildErrorState()
              : Column(
                  children: [
                    // Header with transfer info
                    Container(
                      margin: const EdgeInsets.all(16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF334155),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.transferCode,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.warehouse,
                                color: Colors.white54,
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '${widget.originName} → ${widget.destinationName}',
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Products verification section
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'VERIFICACIÓN DE PRODUCTOS',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.2,
                            ),
                          ),
                          Text(
                            '${products.length} productos',
                            style: const TextStyle(
                              color: Colors.white38,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Products list
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: products.length,
                        itemBuilder: (context, index) {
                          final product = products[index];
                          return _buildProductCard(product);
                        },
                      ),
                    ),

                    // Confirm button
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: const BoxDecoration(
                        color: Color(0xFF334155),
                        border: Border(
                          top: BorderSide(color: Color(0xFF475569)),
                        ),
                      ),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: isSubmitting ? null : _confirmReception,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _hasDiscrepancies
                                ? const Color(0xFFFBBF24)
                                : const Color(0xFF3B82F6),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: isSubmitting
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2.5,
                                  ),
                                )
                              : Text(
                                  _hasDiscrepancies
                                      ? 'Confirmar con Discrepancias'
                                      : 'Confirmar Recepción',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              loadError ?? 'Error al cargar la transferencia',
              style: const TextStyle(color: Colors.white70, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadTransferDetails,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
              ),
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(ProductReception product) {
    final hasDiscrepancy = product.hasDiscrepancy;
    final borderColor = hasDiscrepancy
        ? const Color(0xFFFBBF24) // Yellow for discrepancy
        : const Color(0xFF10B981); // Green for OK

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF334155),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: borderColor,
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      product.sku,
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (hasDiscrepancy)
                const Icon(
                  Icons.warning,
                  color: Color(0xFFFBBF24),
                  size: 24,
                )
              else
                const Icon(
                  Icons.check_circle,
                  color: Color(0xFF10B981),
                  size: 24,
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Enviado:',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatQty(product.expectedQuantity),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Recibido:',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    SizedBox(
                      width: 80,
                      child: TextField(
                        controller: _quantityControllers[product.productId],
                        keyboardType: TextInputType.number,
                        style: TextStyle(
                          color: hasDiscrepancy
                              ? const Color(0xFFFBBF24)
                              : Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        decoration: InputDecoration(
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: hasDiscrepancy
                                  ? const Color(0xFFFBBF24)
                                  : const Color(0xFF475569),
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: hasDiscrepancy
                                  ? const Color(0xFFFBBF24)
                                  : const Color(0xFF3B82F6),
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        onChanged: (value) {
                          final quantity = double.tryParse(value) ?? 0;
                          _updateReceivedQuantity(product.productId, quantity);
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (hasDiscrepancy) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFBBF24).withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: Color(0xFFFBBF24),
                    size: 16,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Diferencia detectada',
                      style: TextStyle(
                        color: Color(0xFFFBBF24),
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

String _formatQty(double quantity) {
  return quantity == quantity.roundToDouble()
      ? quantity.toInt().toString()
      : quantity.toString();
}

class ProductReception {
  final int productId;
  final String sku;
  final String name;
  final double expectedQuantity;
  final double receivedQuantity;
  final bool hasDiscrepancy;

  ProductReception({
    required this.productId,
    required this.sku,
    required this.name,
    required this.expectedQuantity,
    required this.receivedQuantity,
    required this.hasDiscrepancy,
  });

  ProductReception copyWith({
    int? productId,
    String? sku,
    String? name,
    double? expectedQuantity,
    double? receivedQuantity,
    bool? hasDiscrepancy,
  }) {
    return ProductReception(
      productId: productId ?? this.productId,
      sku: sku ?? this.sku,
      name: name ?? this.name,
      expectedQuantity: expectedQuantity ?? this.expectedQuantity,
      receivedQuantity: receivedQuantity ?? this.receivedQuantity,
      hasDiscrepancy: hasDiscrepancy ?? this.hasDiscrepancy,
    );
  }
}
