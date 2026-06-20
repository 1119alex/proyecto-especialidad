import 'package:flutter/material.dart';

/// Paleta cruda de LogiTrack (sistema "Logistics/Delivery").
///
/// Estos son los valores base; las pantallas NO deben usarlos directamente.
/// Consumir siempre vía `Theme.of(context).colorScheme` o la extensión
/// [AppColors] vía `Theme.of(context).appColors`.
class AppPalette {
  AppPalette._();

  // ===== Marca =====
  static const Color brand = Color(0xFF2563EB); // azul tracking (primary)
  static const Color brandStrong = Color(0xFF1D4ED8);
  static const Color brandSoftLight = Color(0xFFDBEAFE);
  static const Color brandSoftDark = Color(0xFF1E3A8A);
  static const Color secondary = Color(0xFF3B82F6);
  static const Color accent = Color(0xFFEA580C); // naranja "en movimiento"
  static const Color accentStrong = Color(0xFFC2410C);

  // ===== Semánticos =====
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFD97706);
  static const Color danger = Color(0xFFDC2626);
  static const Color info = Color(0xFF0891B2);

  // ===== Neutros (slate) — Light =====
  static const Color lightBg = Color(0xFFF8FAFC); // slate-50
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceAlt = Color(0xFFF1F5F9); // slate-100
  static const Color lightOnSurface = Color(0xFF0F172A); // slate-900
  static const Color lightOnSurfaceMuted = Color(0xFF64748B); // slate-500
  static const Color lightBorder = Color(0xFFE2E8F0); // slate-200

  // ===== Neutros (slate) — Dark =====
  static const Color darkBg = Color(0xFF0B1220); // navy casi negro
  static const Color darkSurface = Color(0xFF111A2E);
  static const Color darkSurfaceAlt = Color(0xFF1B2438);
  static const Color darkOnSurface = Color(0xFFF1F5F9);
  static const Color darkOnSurfaceMuted = Color(0xFF94A3B8); // slate-400
  static const Color darkBorder = Color(0xFF2A3552);

  static const Color white = Color(0xFFFFFFFF);
}
