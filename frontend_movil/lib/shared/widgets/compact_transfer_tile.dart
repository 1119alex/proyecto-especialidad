import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/transfer_status_style.dart';
import '../../features/transfers/domain/entities/transfer_entity.dart';
import '../../features/transfers/presentation/widgets/transfer_detail_sheet.dart';
import 'status_badge.dart';

/// Fila compacta de transferencia (para el home/listas del encargado).
/// Al tocar abre el panel de detalle in-place.
class CompactTransferTile extends StatelessWidget {
  const CompactTransferTile({super.key, required this.transfer});

  final TransferEntity transfer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = theme.appColors;
    final style = TransferStatusStyle.of(transfer.status);

    return Material(
      color: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => showTransferDetailSheet(context, transfer.id),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.colorScheme.outline),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: style.base.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(style.icon, color: style.base, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      transfer.transferCode,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${transfer.originWarehouse?.name ?? 'Origen'} → '
                      '${transfer.destinationWarehouse?.name ?? 'Destino'}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: c.muted,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              StatusBadge(transfer.status, dense: true),
            ],
          ),
        ),
      ),
    );
  }
}
