import 'package:flutter/material.dart';

class AppTheme {
  static const Color navyDeep = Color(0xFF0e1e2b);
  static const Color navyLight = Color(0xFF1a2c3d);
  static const Color navyLighter = Color(0xFF243b53);
  static const Color yellow = Color(0xFFfbad1a);
  static const Color textMain = Colors.white;
  static const Color textMuted = Color(0xFF8e99a7);

  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: navyDeep,
    primaryColor: yellow,
    colorScheme: ColorScheme.dark(
      primary: yellow,
      surface: navyLight,
      secondary: yellow,
      onPrimary: navyDeep,
      onSurface: textMain,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: navyDeep,
      iconTheme: IconThemeData(color: yellow),
      titleTextStyle: TextStyle(color: textMain, fontWeight: FontWeight.bold, fontSize: 20),
    ),
    textTheme: TextTheme(
      bodyLarge: TextStyle(color: textMain),
      bodyMedium: TextStyle(color: textMain),
      bodySmall: TextStyle(color: textMuted),
    ),
    cardColor: navyLight,
    iconTheme: IconThemeData(color: yellow),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: yellow,
      foregroundColor: navyDeep,
    ),
  );

  static ThemeData lightTheme = ThemeData(
    brightness: Brightness.light,
    scaffoldBackgroundColor: Color(0xFFF0F2F5),
    primaryColor: yellow,
    colorScheme: ColorScheme.light(
      primary: yellow,
      surface: Colors.white,
      secondary: yellow,
      onPrimary: navyDeep,
      onSurface: navyDeep,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      iconTheme: IconThemeData(color: navyDeep),
      titleTextStyle: TextStyle(color: navyDeep, fontWeight: FontWeight.bold, fontSize: 20),
    ),
    textTheme: TextTheme(
      bodyLarge: TextStyle(color: navyDeep),
      bodyMedium: TextStyle(color: navyDeep),
      bodySmall: TextStyle(color: textMuted),
    ),
    cardColor: Colors.white,
    iconTheme: IconThemeData(color: navyDeep),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: yellow,
      foregroundColor: navyDeep,
    ),
  );
}
