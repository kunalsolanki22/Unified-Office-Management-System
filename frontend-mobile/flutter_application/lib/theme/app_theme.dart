import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Shared design tokens matching the desktop React app.
/// Desktop CSS variables → Flutter constants.
class AppColors {
  // Primary palette
  static const Color primary = Color(0xFF1A367C);       // --color-primary (navy)
  static const Color primaryLight = Color(0xFF2C4A96);  // hover / lighter navy
  static const Color primaryBg = Color(0xFFEFF6FF);     // light blue tint for icons

  // Accent
  static const Color accent = Color(0xFFFFB012);        // --color-secondary (gold)
  static const Color accentLight = Color(0xFFFFC24D);   // lighter gold

  // Backgrounds & surfaces
  static const Color background = Color(0xFFF8FAFC);    // --color-background (slate-50)
  static const Color surface = Colors.white;

  // Text
  static const Color textDark = Color(0xFF1E293B);      // primary body text
  static const Color textMuted = Color(0xFF8892B0);     // --color-text-muted
  static const Color textLight = Color(0xFFCCD6F6);     // dark-mode light text

  // Status
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);

  // Neutrals
  static const Color grey50 = Color(0xFFF8FAFC);
  static const Color grey100 = Color(0xFFF1F5F9);
  static const Color grey200 = Color(0xFFE2E8F0);
  static const Color grey400 = Color(0xFF94A3B8);
  static const Color grey500 = Color(0xFF64748B);
  static const Color grey700 = Color(0xFF334155);
}

class AppTheme {
  // ─── Legacy aliases (used by dashboards) ───
  static const Color navyDeep = AppColors.primary;
  static const Color navyLight = AppColors.primaryLight;
  static const Color yellow = AppColors.accent;
  static const Color textMain = Colors.white;
  static const Color textMuted = AppColors.textMuted;

  static TextTheme _buildTextTheme(TextTheme base) {
    return GoogleFonts.interTextTheme(base);
  }

  // ═══════════════════════════════════════════
  //  LIGHT THEME
  // ═══════════════════════════════════════════
  static ThemeData lightTheme = ThemeData(
    brightness: Brightness.light,
    scaffoldBackgroundColor: AppColors.background,
    primaryColor: AppColors.primary,
    colorScheme: const ColorScheme.light(
      primary: AppColors.primary,
      secondary: AppColors.accent,
      surface: AppColors.surface,
      onPrimary: Colors.white,
      onSurface: AppColors.textDark,
    ),
    textTheme: _buildTextTheme(ThemeData.light().textTheme),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.surface,
      iconTheme: const IconThemeData(color: AppColors.primary),
      titleTextStyle: GoogleFonts.inter(
        color: AppColors.primary,
        fontWeight: FontWeight.bold,
        fontSize: 20,
      ),
      elevation: 0,
    ),
    cardColor: AppColors.surface,
    iconTheme: const IconThemeData(color: AppColors.primary),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.accent,
      foregroundColor: AppColors.primary,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: AppColors.grey200),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: AppColors.grey200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.primary),
      ),
    ),
  );

  // ═══════════════════════════════════════════
  //  DARK THEME
  // ═══════════════════════════════════════════
  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF0F172A),  // slate-900
    primaryColor: AppColors.accent,
    colorScheme: ColorScheme.dark(
      primary: AppColors.accent,
      secondary: AppColors.accent,
      surface: const Color(0xFF1E293B),   // slate-800
      onPrimary: AppColors.primary,
      onSurface: AppColors.textLight,
    ),
    textTheme: _buildTextTheme(ThemeData.dark().textTheme),
    appBarTheme: AppBarTheme(
      backgroundColor: const Color(0xFF0F172A),
      iconTheme: const IconThemeData(color: AppColors.accent),
      titleTextStyle: GoogleFonts.inter(
        color: AppColors.textLight,
        fontWeight: FontWeight.bold,
        fontSize: 20,
      ),
      elevation: 0,
    ),
    cardColor: const Color(0xFF1E293B),
    iconTheme: const IconThemeData(color: AppColors.accent),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: AppColors.primary,
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.accent,
      foregroundColor: AppColors.primary,
    ),
  );
}
