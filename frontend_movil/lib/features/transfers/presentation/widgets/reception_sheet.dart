import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../providers/transfers_provider.dart';

/// Abre la recepción de carga como panel in-place (conteo de cantidades y
/// detección de discrepancias). Devuelve `true` si la recepción se confirmó.
Future<bool?> showReceptionSheet(
  BuildContext context, {
  required int transferId,
  required String transferCode,
  String? originName,
  String? destinationName,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    isDismissible: true,
    builder: (_) => FractionallySizedBox(
      heightFactor: 0.92,
      child: ReceptionSheet(
        transferId: transferId,
        transferCode: transferCode,
        originName: originName,
        destinationName: destinationName,
      ),
    ),
  );
}

class _RxProduct {
  _RxProduct({
    required this.productId,
    required this.sku,
    required this.name,
    required this.unit,
    required this.expected,
    required this.received,
  });

  final int productId;
  final String sku;
  final String name;
  final String unit;
  final double expected;
  double received;

  bool get hasDiscrepancy => received != expected;
}

class ReceptionSheet extends ConsumerStatefulWidget {
  const ReceptionSheet({
    super.key,
    required this.transferId,
    required this.transferCode,
    this.originName,
    this.destinationName,
  });

  final int transferId;
  final String transferCode;
  final String? originName;
  final String? destinationName;

  @override
  ConsumerState<ReceptionSheet> createState() => _ReceptionSheetState();
}

class _ReceptionSheetState extends ConsumerState<ReceptionSheet> {
  final Map<int, TextEditingController> _controllers = {};
  final List<_RxProduct> _products = [];
  bool _loading = true;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  static String _fmt(double q) =>
      q == q.roundToDouble() ? q.toInt().toString() : q.toString();

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final t = await ref.read(
        transferDetailProvider(widget.transferId).future,
      );
      _products.clear();
      for (final d in t.details ?? []) {
        _products.add(
          _RxProduct(
            productId: d.productId,
            sku: d.productSku,
            name: d.productName,
            unit: d.unit,
            expected: d.quantityExpected,
            received: d.quantityExpected,
          ),
        );
      }
      for (final p in _products) {
        _controllers[p.productId] = TextEditingController(
          text: _fmt(p.received),
        );
      }
      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  bool get _hasDiscrepancies => _products.any((p) => p.hasDiscrepancy);

  Future<void> _confirm() async {
    if (_submitting) return;

    if (_hasDiscrepancies) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Discrepancias detectadas'),
          content: const Text(
            'Hay diferencias entre lo enviado y lo recibido. Se cerrará como '
            '"Completada con discrepancia" y se notificará al administrador. '
            '¿Continuar?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Revisar'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Confirmar'),
            ),
          ],
        ),
      );
      if (ok != true) return;
    }

    setState(() => _submitting = true);
    try {
      final payload = _products
          .map((p) => {'productId': p.productId, 'quantity': p.received})
          .toList();
      await ref
          .read(transferDetailProvider(widget.transferId).notifier)
          .completeReception(payload);
      ref.invalidate(transfersProvider);

      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(
              _hasDiscrepancies
                  ? 'Recepción registrada con discrepancias.'
                  : 'Recepción confirmada. Inventario actualizado.',
            ),
          ),
        );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Column(
            children: [
              const _GrabHandle(),
              _header(theme),
              Expanded(child: _body(theme)),
              if (!_loading && _error == null) _confirmBar(theme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _header(ThemeData theme) {
    final c = theme.appColors;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Recepción · ${widget.transferCode}',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close_rounded),
              ),
            ],
          ),
          if (widget.originName != null && widget.destinationName != null)
            Text(
              '${widget.originName} → ${widget.destinationName}',
              style: theme.textTheme.bodyMedium?.copyWith(color: c.muted),
            ),
        ],
      ),
    );
  }

  Widget _body(ThemeData theme) {
    if (_loading) return const LoadingStateView(label: 'Cargando productos...');
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
      itemCount: _products.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _ProductCard(
        product: _products[i],
        controller: _controllers[_products[i].productId]!,
        onChanged: (v) => setState(() => _products[i].received = v),
      ),
    );
  }

  Widget _confirmBar(ThemeData theme) {
    final scheme = theme.colorScheme;
    final warn = theme.appColors.warning;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(top: BorderSide(color: scheme.outline)),
      ),
      child: SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: _submitting ? null : _confirm,
          icon: _submitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.white,
                  ),
                )
              : Icon(
                  _hasDiscrepancies
                      ? Icons.report_problem_outlined
                      : Icons.check_rounded,
                ),
          label: Text(
            _hasDiscrepancies
                ? 'Confirmar con discrepancias'
                : 'Confirmar recepción',
          ),
          style: FilledButton.styleFrom(
            minimumSize: const Size.fromHeight(52),
            backgroundColor: _hasDiscrepancies ? warn : scheme.primary,
          ),
        ),
      ),
    );
  }
}

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

class _ProductCard extends StatelessWidget {
  const _ProductCard({
    required this.product,
    required this.controller,
    required this.onChanged,
  });

  final _RxProduct product;
  final TextEditingController controller;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    final discrepancy = product.hasDiscrepancy;
    final flag = discrepancy ? c.warning : c.success;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surfaceAlt,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: flag.withValues(alpha: 0.55)),
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
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'SKU ${product.sku}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: c.muted,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                discrepancy
                    ? Icons.warning_amber_rounded
                    : Icons.check_circle_outline,
                color: flag,
                size: 22,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Enviado',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: c.muted,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_ReceptionSheetState._fmt(product.expected)} ${product.unit}',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Recibido',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: c.muted,
                      ),
                    ),
                    const SizedBox(height: 2),
                    SizedBox(
                      width: 96,
                      child: TextField(
                        controller: controller,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: discrepancy ? c.warning : null,
                        ),
                        decoration: InputDecoration(
                          isDense: true,
                          suffixText: product.unit,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 8,
                          ),
                        ),
                        onChanged: (v) => onChanged(double.tryParse(v) ?? 0),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (discrepancy) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.info_outline, size: 15, color: c.warning),
                const SizedBox(width: 6),
                Text(
                  'Diferencia detectada',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: c.warning,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
