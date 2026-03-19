import 'package:flutter/material.dart';

/// Application Theme Configuration
class AppTheme {
  AppTheme._();

  // Color Palette
  static const Color primaryColor = Color(0xFF1976D2); // Azul
  static const Color secondaryColor = Color(0xFF00C853); // Verde
  static const Color errorColor = Color(0xFFD32F2F); // Rojo
  static const Color warningColor = Color(0xFFFFA726); // Naranja
  static const Color successColor = Color(0xFF66BB6A); // Verde claro
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color surfaceColor = Colors.white;
  static const Color darkBackgroundColor = Color(0xFF1A1A1A);

  // Text Colors
  static const Color textPrimaryColor = Color(0xFF212121);
  static const Color textSecondaryColor = Color(0xFF757575);
  static const Color textDisabledColor = Color(0xFFBDBDBD);

  // Status Colors (para badges de transferencias)
  static const Color statusPendienteColor = Color(0xFFFF9800);
  static const Color statusAsignadaColor = Color(0xFF2196F3);
  static const Color statusEnPreparacionColor = Color(0xFF9C27B0);
  static const Color statusEnTransitoColor = Color(0xFF00BCD4);
  static const Color statusLlegadaColor = Color(0xFFFFEB3B);
  static const Color statusCompletadaColor = Color(0xFF4CAF50);
  static const Color statusCanceladaColor = Color(0xFFF44336);

  // Light Theme
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.light(
        primary: primaryColor,
        secondary: secondaryColor,
        error: errorColor,
        surface: surfaceColor,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onError: Colors.white,
        onSurface: textPrimaryColor,
      ),
      scaffoldBackgroundColor: backgroundColor,
      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        centerTitle: true,
        iconTheme: IconThemeData(color: Colors.white),
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        color: surfaceColor,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.grey[100],
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: errorColor, width: 1),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: secondaryColor,
        foregroundColor: Colors.white,
      ),
    );
  }

  // Dark Theme (opcional, para futuro)
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.dark(
        primary: primaryColor,
        secondary: secondaryColor,
        error: errorColor,
        surface: darkBackgroundColor,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onError: Colors.white,
        onSurface: Colors.white,
      ),
      scaffoldBackgroundColor: darkBackgroundColor,
      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: darkBackgroundColor,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
    );
  }

  // Helper para obtener color según estado de transferencia
  static Color getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDIENTE':
        return statusPendienteColor;
      case 'ASIGNADA':
        return statusAsignadaColor;
      case 'EN_PREPARACION':
        return statusEnPreparacionColor;
      case 'EN_TRANSITO':
        return statusEnTransitoColor;
      case 'LLEGADA':
        return statusLlegadaColor;
      case 'COMPLETADA':
        return statusCompletadaColor;
      case 'CANCELADA':
        return statusCanceladaColor;
      default:
        return Colors.grey;
    }
  }

  // Text Styles
  static const TextStyle headline1 = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: textPrimaryColor,
  );

  static const TextStyle headline2 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: textPrimaryColor,
  );

  static const TextStyle bodyText1 = TextStyle(
    fontSize: 16,
    color: textPrimaryColor,
  );

  static const TextStyle bodyText2 = TextStyle(
    fontSize: 14,
    color: textSecondaryColor,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 12,
    color: textSecondaryColor,
  );
}
