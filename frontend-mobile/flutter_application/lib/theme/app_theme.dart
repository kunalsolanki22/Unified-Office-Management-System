import 'package:flutter/material.dart';

class AppTheme {
  // Core palette (matches screenshots)
  static const Color navyDeep = Color(0xFF0E1E2B);
  static const Color navyMid = Color(0xFF162A3A);
  static const Color navyLight = Color(0xFF1F3549);
  static const Color navyLighter = Color(0xFF2A455F);

  static const Color amber = Color(0xFFFBAE17);
  static const Color textMain = Colors.white;
  static const Color textMuted = Color(0xFF8FA1B3);
  static const Color divider = Color(0xFF23384D);

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: navyDeep,

    colorScheme: const ColorScheme.dark(
      primary: amber,
      secondary: amber,
      background: navyDeep,
      surface: navyMid,
      onPrimary: navyDeep,
      onSecondary: navyDeep,
      onBackground: textMain,
      onSurface: textMain,
    ),

    // AppBar
    appBarTheme: const AppBarTheme(
      backgroundColor: navyDeep,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: textMain,
        fontWeight: FontWeight.w700,
        fontSize: 22,
        letterSpacing: 0.2,
      ),
      iconTheme: IconThemeData(color: amber),
    ),

    // Cards (rounded, glassy look)
    cardTheme: CardThemeData(
      color: navyMid,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
    ),

    // Buttons
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: amber,
        foregroundColor: navyDeep,
        elevation: 0,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: textMain,
        side: const BorderSide(color: divider),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    ),

    // Bottom Navigation Bar
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: navyMid,
      selectedItemColor: amber,
      unselectedItemColor: Color(0xFF6F8396),
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      showSelectedLabels: true,
      showUnselectedLabels: true,
    ),

    // Inputs
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: navyMid,
      hintStyle: const TextStyle(color: textMuted),
      labelStyle: const TextStyle(color: textMuted),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: amber, width: 1.5),
      ),
    ),

    // Text
    textTheme: const TextTheme(
      headlineLarge: TextStyle(color: textMain, fontWeight: FontWeight.w700),
      headlineMedium: TextStyle(color: textMain, fontWeight: FontWeight.w600),
      titleMedium: TextStyle(color: textMain, fontWeight: FontWeight.w600),
      bodyLarge: TextStyle(color: textMain),
      bodyMedium: TextStyle(color: textMain),
      bodySmall: TextStyle(color: textMuted),
      labelLarge: TextStyle(color: textMuted),
    ),

    dividerTheme: const DividerThemeData(
      color: divider,
      thickness: 1,
    ),

    iconTheme: const IconThemeData(color: amber),
  );
}
