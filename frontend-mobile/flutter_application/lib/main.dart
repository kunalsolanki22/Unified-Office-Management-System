import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';

final ValueNotifier<ThemeMode> themeNotifier = ValueNotifier(ThemeMode.light);

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeNotifier,
      builder: (context, currentMode, child) {
        return MaterialApp(
          title: 'Cygnet.One',
          debugShowCheckedModeBanner: false,
          themeMode: currentMode,
          theme: ThemeData(
            brightness: Brightness.light,
            colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1A237E)), // Navy Blue
            scaffoldBackgroundColor: Colors.white,
            useMaterial3: true,
            fontFamily: GoogleFonts.roboto().fontFamily,
            textTheme: GoogleFonts.robotoTextTheme(),
            fontFamilyFallback: const [
              'system-ui',
              'Avenir',
              'Helvetica',
              'Arial',
              'sans-serif',
            ],
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF1A237E),
              brightness: Brightness.dark,
              surface: const Color(0xFF2D2D2D), // Dark Grey for cards
            ),
            scaffoldBackgroundColor: const Color(0xFF1E1E1E), // Darker Grey for background
            cardColor: const Color(0xFF2D2D2D),
            useMaterial3: true,
            fontFamily: GoogleFonts.roboto().fontFamily,
            textTheme: GoogleFonts.robotoTextTheme(ThemeData.dark().textTheme),
            fontFamilyFallback: const [
              'system-ui',
              'Avenir',
              'Helvetica',
              'Arial',
              'sans-serif',
            ],
          ),
          home: const LoginPage(),
        );
      },
    );
  }
}
