import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
    });

    try {
      // TODO: Load transfer details from API
      // final details = await ref.read(transfersProvider.notifier)
      //     .getTransferDetails(widget.transferId);

      // Mock data
      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        products.addAll([
          ProductReception(
            id: 1,
            sku: 'PROD001',
            name: 'Laptop HP 15',
            expectedQuantity: 10,
            receivedQuantity: 10,
            hasDiscrepancy: false,
          ),
          ProductReception(
            id: 2,
            sku: 'PROD002',
            name: 'Monitor 24"',
            expectedQuantity: 5,
            receivedQuantity: 4,
            hasDiscrepancy: true,
          ),
          ProductReception(
            id: 3,
            sku: 'PROD003',
            name: 'Teclado USB',
            expectedQuantity: 20,
            receivedQuantity: 20,
            hasDiscrepancy: false,
          ),
        ]);

        for (var product in products) {
          _quantityControllers[product.id] = TextEditingController(
            text: product.receivedQuantity.toString(),
          );
        }

        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar detalles: $e')),
        );
      }
    }
  }

  void _updateReceivedQuantity(int productId, int quantity) {
    setState(() {
      final index = products.indexWhere((p) => p.id == productId);
      if (index != -1) {
        products[index] = products[index].copyWith(
          receivedQuantity: quantity,
          hasDiscrepancy: quantity != products[index].expectedQuantity,
        );
      }
    });
  }

  Future<void> _confirmReception() async {
    // TODO: Send reception confirmation to API
    // final receivedQuantities = products.map((p) => {
    //   'productId': p.id,
    //   'quantity': p.receivedQuantity,
    // }).toList();

    // Show success dialog
    if (mounted) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Recepción Confirmada'),
          content: const Text(
              'La recepción de la carga ha sido confirmada exitosamente.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop();
              },
              child: const Text('Aceptar'),
            ),
          ],
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
          onPressed: () => Navigator.of(context).pop(),
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
                      onPressed: _confirmReception,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3B82F6),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Confirmar Recepción',
                        style: TextStyle(
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
                      product.expectedQuantity.toString(),
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
                        controller: _quantityControllers[product.id],
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
                          final quantity = int.tryParse(value) ?? 0;
                          _updateReceivedQuantity(product.id, quantity);
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
              child: Row(
                children: [
                  const Icon(
                    Icons.info_outline,
                    color: Color(0xFFFBBF24),
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
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

class ProductReception {
  final int id;
  final String sku;
  final String name;
  final int expectedQuantity;
  final int receivedQuantity;
  final bool hasDiscrepancy;

  ProductReception({
    required this.id,
    required this.sku,
    required this.name,
    required this.expectedQuantity,
    required this.receivedQuantity,
    required this.hasDiscrepancy,
  });

  ProductReception copyWith({
    int? id,
    String? sku,
    String? name,
    int? expectedQuantity,
    int? receivedQuantity,
    bool? hasDiscrepancy,
  }) {
    return ProductReception(
      id: id ?? this.id,
      sku: sku ?? this.sku,
      name: name ?? this.name,
      expectedQuantity: expectedQuantity ?? this.expectedQuantity,
      receivedQuantity: receivedQuantity ?? this.receivedQuantity,
      hasDiscrepancy: hasDiscrepancy ?? this.hasDiscrepancy,
    );
  }
}
