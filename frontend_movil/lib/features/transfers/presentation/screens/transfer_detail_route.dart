import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router/app_router.dart';
import '../widgets/transfer_detail_sheet.dart';

/// Destino del deep-link `/transfers/:id` (p. ej. al tocar una notificación).
/// No es una pantalla propia: abre el panel de detalle in-place sobre un
/// fondo del tema y, al cerrarlo, lleva al inicio. Así existe un único
/// diseño de detalle (el sheet), sin pantallas legacy.
class TransferDetailRoute extends StatefulWidget {
  const TransferDetailRoute({super.key, required this.transferId});

  final int transferId;

  @override
  State<TransferDetailRoute> createState() => _TransferDetailRouteState();
}

class _TransferDetailRouteState extends State<TransferDetailRoute> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await showTransferDetailSheet(context, widget.transferId);
      if (mounted) context.go(AppRoutes.inicio);
    });
  }

  @override
  Widget build(BuildContext context) => const Scaffold(body: SizedBox.shrink());
}
