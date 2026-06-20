import 'package:flutter/material.dart';

/// Notificación del usuario (RF06). Mapea la respuesta de `GET /notifications`.
class NotificationItem {
  NotificationItem({
    required this.id,
    required this.type,
    required this.priority,
    required this.title,
    required this.message,
    required this.isRead,
    required this.sentAt,
    this.transferId,
  });

  final int id;
  final String type;
  final String priority;
  final String title;
  final String message;
  final bool isRead;
  final DateTime sentAt;
  final int? transferId;

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] as int,
      type: (json['type'] ?? 'SISTEMA').toString(),
      priority: (json['priority'] ?? 'NORMAL').toString(),
      title: (json['title'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      isRead: json['isRead'] == true,
      sentAt:
          DateTime.tryParse(json['sentAt']?.toString() ?? '') ?? DateTime.now(),
      transferId: json['transferId'] as int?,
    );
  }

  NotificationItem copyWith({bool? isRead}) => NotificationItem(
    id: id,
    type: type,
    priority: priority,
    title: title,
    message: message,
    isRead: isRead ?? this.isRead,
    sentAt: sentAt,
    transferId: transferId,
  );

  bool get isUrgent => priority == 'HIGH' || priority == 'URGENT';

  IconData get icon {
    switch (type) {
      case 'ASIGNACION':
        return Icons.assignment_ind_outlined;
      case 'PREPARACION':
        return Icons.inventory_2_outlined;
      case 'EN_RUTA':
        return Icons.local_shipping_outlined;
      case 'LLEGADA':
        return Icons.where_to_vote_outlined;
      case 'RECEPCION':
        return Icons.fact_check_outlined;
      case 'DISCREPANCIA':
        return Icons.report_problem_outlined;
      case 'CANCELACION':
        return Icons.cancel_outlined;
      default:
        return Icons.notifications_none_rounded;
    }
  }

  /// Tiempo relativo legible ("hace 5 min", "ayer").
  String get relativeTime {
    final diff = DateTime.now().difference(sentAt);
    if (diff.inMinutes < 1) return 'ahora';
    if (diff.inMinutes < 60) return 'hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'hace ${diff.inHours} h';
    if (diff.inDays == 1) return 'ayer';
    if (diff.inDays < 7) return 'hace ${diff.inDays} días';
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(sentAt.day)}/${two(sentAt.month)}';
  }
}
