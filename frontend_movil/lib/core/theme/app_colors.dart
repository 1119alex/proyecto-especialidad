import 'package:flutter/material.dart';
import 'app_palette.dart';

/// Tokens semánticos adicionales que Material `ColorScheme` no cubre
/// (superficie alternativa, texto atenuado, colores de estado, acento).
///
/// Se exponen como [ThemeExtension] para que se interpolen en las
/// transiciones de tema y se adapten automáticamente a light/dark.
///
/// Uso: `final c = Theme.of(context).appColors;`
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.surfaceAlt,
    required this.muted,
    required this.border,
    required this.accent,
    required this.onAccent,
    required this.success,
    required this.warning,
    required this.danger,
    required this.info,
  });

  /// Superficie secundaria (fondos de chips, headers translúcidos).
  final Color surfaceAlt;

  /// Texto/íconos atenuados (subtítulos, metadatos).
  final Color muted;

  /// Bordes y divisores.
  final Color border;

  final Color accent;
  final Color onAccent;
  final Color success;
  final Color warning;
  final Color danger;
  final Color info;

  static const light = AppColors(
    surfaceAlt: AppPalette.lightSurfaceAlt,
    muted: AppPalette.lightOnSurfaceMuted,
    border: AppPalette.lightBorder,
    accent: AppPalette.accent,
    onAccent: AppPalette.white,
    success: AppPalette.success,
    warning: AppPalette.warning,
    danger: AppPalette.danger,
    info: AppPalette.info,
  );

  static const dark = AppColors(
    surfaceAlt: AppPalette.darkSurfaceAlt,
    muted: AppPalette.darkOnSurfaceMuted,
    border: AppPalette.darkBorder,
    accent: Color(0xFFFB923C), // naranja un poco más claro para dark
    onAccent: Color(0xFF1A1206),
    success: Color(0xFF34D399),
    warning: Color(0xFFFBBF24),
    danger: Color(0xFFF87171),
    info: Color(0xFF38BDF8),
  );

  @override
  AppColors copyWith({
    Color? surfaceAlt,
    Color? muted,
    Color? border,
    Color? accent,
    Color? onAccent,
    Color? success,
    Color? warning,
    Color? danger,
    Color? info,
  }) {
    return AppColors(
      surfaceAlt: surfaceAlt ?? this.surfaceAlt,
      muted: muted ?? this.muted,
      border: border ?? this.border,
      accent: accent ?? this.accent,
      onAccent: onAccent ?? this.onAccent,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      danger: danger ?? this.danger,
      info: info ?? this.info,
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      surfaceAlt: Color.lerp(surfaceAlt, other.surfaceAlt, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      border: Color.lerp(border, other.border, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      onAccent: Color.lerp(onAccent, other.onAccent, t)!,
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      info: Color.lerp(info, other.info, t)!,
    );
  }
}

/// Acceso ergonómico a la extensión: `Theme.of(context).appColors`.
extension AppColorsX on ThemeData {
  AppColors get appColors => extension<AppColors>() ?? AppColors.light;
}
