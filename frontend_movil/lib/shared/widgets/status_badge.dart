import 'package:flutter/material.dart';
import '../../core/theme/transfer_status_style.dart';

/// Badge de estado de transferencia, coherente en light y dark.
/// Toma su color/etiqueta/ícono del sistema único [TransferStatusStyle].
class StatusBadge extends StatelessWidget {
  const StatusBadge(this.status, {super.key, this.dense = false});

  final String status;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final style = TransferStatusStyle.of(status);
    final fg = style.onSoft(brightness);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: dense ? 8 : 10,
        vertical: dense ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: style.soft(brightness),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(style.icon, size: dense ? 12 : 14, color: fg),
          const SizedBox(width: 5),
          Text(
            style.label,
            style: TextStyle(
              color: fg,
              fontSize: dense ? 10.5 : 11.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
