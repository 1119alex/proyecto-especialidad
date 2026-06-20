import 'package:flutter/material.dart';
import 'app_palette.dart';
import 'app_colors.dart';

/// Tema central de LogiTrack — Material 3, light + dark coherentes.
///
/// Paleta "Logistics/Delivery": azul de tracking + naranja de movimiento,
/// neutros slate. Todas las pantallas consumen tokens desde aquí
/// (`ColorScheme` + extensión [AppColors]); nada de hex sueltos.
class AppTheme {
  AppTheme._();

  static const double radiusSm = 10;
  static const double radiusMd = 14;
  static const double radiusLg = 20;

  // ===================== LIGHT =====================
  static ThemeData get lightTheme => _build(
        brightness: Brightness.light,
        scheme: const ColorScheme.light(
          primary: AppPalette.brand,
          onPrimary: AppPalette.white,
          primaryContainer: AppPalette.brandSoftLight,
          onPrimaryContainer: Color(0xFF1E3A8A),
          secondary: AppPalette.secondary,
          onSecondary: AppPalette.white,
          tertiary: AppPalette.accent,
          onTertiary: AppPalette.white,
          error: AppPalette.danger,
          onError: AppPalette.white,
          surface: AppPalette.lightSurface,
          onSurface: AppPalette.lightOnSurface,
          surfaceContainerLowest: AppPalette.white,
          surfaceContainerLow: AppPalette.lightBg,
          surfaceContainer: AppPalette.lightSurfaceAlt,
          onSurfaceVariant: AppPalette.lightOnSurfaceMuted,
          outline: AppPalette.lightBorder,
          outlineVariant: AppPalette.lightBorder,
        ),
        scaffoldBg: AppPalette.lightBg,
        appColors: AppColors.light,
      );

  // ===================== DARK =====================
  static ThemeData get darkTheme => _build(
        brightness: Brightness.dark,
        scheme: const ColorScheme.dark(
          primary: AppPalette.secondary,
          onPrimary: Color(0xFF06122B),
          primaryContainer: AppPalette.brandSoftDark,
          onPrimaryContainer: Color(0xFFDBEAFE),
          secondary: Color(0xFF60A5FA),
          onSecondary: Color(0xFF06122B),
          tertiary: Color(0xFFFB923C),
          onTertiary: Color(0xFF1A1206),
          error: Color(0xFFF87171),
          onError: Color(0xFF2A0A0A),
          surface: AppPalette.darkSurface,
          onSurface: AppPalette.darkOnSurface,
          surfaceContainerLowest: AppPalette.darkBg,
          surfaceContainerLow: Color(0xFF0E1626),
          surfaceContainer: AppPalette.darkSurfaceAlt,
          onSurfaceVariant: AppPalette.darkOnSurfaceMuted,
          outline: AppPalette.darkBorder,
          outlineVariant: AppPalette.darkBorder,
        ),
        scaffoldBg: AppPalette.darkBg,
        appColors: AppColors.dark,
      );

  // ===================== BUILDER =====================
  static ThemeData _build({
    required Brightness brightness,
    required ColorScheme scheme,
    required Color scaffoldBg,
    required AppColors appColors,
  }) {
    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: scaffoldBg,
      splashFactory: InkSparkle.splashFactory,
      extensions: [appColors],
    );

    final textTheme = base.textTheme.apply(
      bodyColor: scheme.onSurface,
      displayColor: scheme.onSurface,
    );

    return base.copyWith(
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: scaffoldBg,
        foregroundColor: scheme.onSurface,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: scheme.surface,
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          side: BorderSide(color: scheme.outline),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          minimumSize: const Size.fromHeight(52),
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          textStyle: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          foregroundColor: scheme.primary,
          side: BorderSide(color: scheme.outline),
          textStyle: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: scheme.primary),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: appColors.surfaceAlt,
        hintStyle: TextStyle(color: appColors.muted),
        labelStyle: TextStyle(color: appColors.muted),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(color: scheme.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(color: scheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(color: scheme.error, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(color: scheme.error, width: 2),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: appColors.surfaceAlt,
        side: BorderSide(color: scheme.outline),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
        ),
      ),
      dividerTheme: DividerThemeData(color: scheme.outline, thickness: 1),
      iconTheme: IconThemeData(color: scheme.onSurface),
      dialogTheme: DialogThemeData(
        backgroundColor: scheme.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: brightness == Brightness.dark
            ? AppPalette.darkSurfaceAlt
            : AppPalette.lightOnSurface,
        contentTextStyle: TextStyle(
          color: brightness == Brightness.dark
              ? AppPalette.darkOnSurface
              : AppPalette.white,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
      ),
    );
  }
}
