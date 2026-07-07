import 'package:flutter/material.dart';

/// Fuente ÚNICA de verdad para la apariencia de cada estado de transferencia.
///
/// Antes el color de un estado se definía en 3 lugares distintos (tema, borde
/// de la card y badge) con valores divergentes. Todo eso ahora sale de aquí.
class TransferStatusStyle {
  const TransferStatusStyle({
    required this.label,
    required this.icon,
    required this.base,
    required this.onSoftLight,
    required this.softLight,
    required this.onSoftDark,
  });

  /// Etiqueta legible (ej. "EN TRÁNSITO").
  final String label;

  /// Ícono representativo del estado.
  final IconData icon;

  /// Color sólido (bordes, íconos, indicadores).
  final Color base;

  // Pares calculados para el badge en cada tema.
  final Color softLight;
  final Color onSoftLight;
  final Color onSoftDark;

  /// Fondo del badge según el brillo del tema.
  Color soft(Brightness b) =>
      b == Brightness.dark ? base.withValues(alpha: 0.22) : softLight;

  /// Texto del badge según el brillo del tema.
  Color onSoft(Brightness b) => b == Brightness.dark ? onSoftDark : onSoftLight;

  static const _fallback = TransferStatusStyle(
    label: 'DESCONOCIDO',
    icon: Icons.help_outline,
    base: Color(0xFF64748B),
    softLight: Color(0xFFF1F5F9),
    onSoftLight: Color(0xFF475569),
    onSoftDark: Color(0xFFCBD5E1),
  );

  static const Map<String, TransferStatusStyle> _byStatus = {
    'PENDIENTE': TransferStatusStyle(
      label: 'PENDIENTE',
      icon: Icons.schedule,
      base: Color(0xFFD97706),
      softLight: Color(0xFFFEF3C7),
      onSoftLight: Color(0xFF92400E),
      onSoftDark: Color(0xFFFCD34D),
    ),
    'ASIGNADA': TransferStatusStyle(
      label: 'ASIGNADA',
      icon: Icons.assignment_ind_outlined,
      base: Color(0xFF2563EB),
      softLight: Color(0xFFDBEAFE),
      onSoftLight: Color(0xFF1E40AF),
      onSoftDark: Color(0xFF93C5FD),
    ),
    'EN_PREPARACION': TransferStatusStyle(
      label: 'EN PREPARACIÓN',
      icon: Icons.inventory_2_outlined,
      base: Color(0xFF7C3AED),
      softLight: Color(0xFFEDE9FE),
      onSoftLight: Color(0xFF5B21B6),
      onSoftDark: Color(0xFFC4B5FD),
    ),
    'LISTA_DESPACHO': TransferStatusStyle(
      label: 'LISTA PARA DESPACHO',
      icon: Icons.qr_code_2_outlined,
      base: Color(0xFF059669),
      softLight: Color(0xFFD1FAE5),
      onSoftLight: Color(0xFF065F46),
      onSoftDark: Color(0xFF6EE7B7),
    ),
    'EN_TRANSITO': TransferStatusStyle(
      label: 'EN TRÁNSITO',
      icon: Icons.local_shipping_outlined,
      base: Color(0xFFEA580C),
      softLight: Color(0xFFFFEDD5),
      onSoftLight: Color(0xFF9A3412),
      onSoftDark: Color(0xFFFDBA74),
    ),
    'LLEGADA_DESTINO': TransferStatusStyle(
      label: 'LLEGÓ A DESTINO',
      icon: Icons.where_to_vote_outlined,
      base: Color(0xFF0891B2),
      softLight: Color(0xFFCFFAFE),
      onSoftLight: Color(0xFF155E75),
      onSoftDark: Color(0xFF67E8F9),
    ),
    'COMPLETADA': TransferStatusStyle(
      label: 'COMPLETADA',
      icon: Icons.check_circle_outline,
      base: Color(0xFF16A34A),
      softLight: Color(0xFFDCFCE7),
      onSoftLight: Color(0xFF166534),
      onSoftDark: Color(0xFF86EFAC),
    ),
    'COMPLETADA_CON_DISCREPANCIA': TransferStatusStyle(
      label: 'COMPLETADA C/ DISCREPANCIA',
      icon: Icons.rule_rounded,
      base: Color(0xFFD97706),
      softLight: Color(0xFFFEF3C7),
      onSoftLight: Color(0xFF92400E),
      onSoftDark: Color(0xFFFCD34D),
    ),
    'CANCELADA': TransferStatusStyle(
      label: 'CANCELADA',
      icon: Icons.cancel_outlined,
      base: Color(0xFFDC2626),
      softLight: Color(0xFFFEE2E2),
      onSoftLight: Color(0xFF991B1B),
      onSoftDark: Color(0xFFFCA5A5),
    ),
  };

  /// Devuelve el estilo del estado (tolerante a mayúsculas/espacios).
  static TransferStatusStyle of(String status) =>
      _byStatus[status.toUpperCase().trim()] ?? _fallback;
}
