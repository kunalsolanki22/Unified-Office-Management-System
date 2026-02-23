import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/manager/manager_dashboard.dart';
import 'screens/employee/employee_dashboard.dart';
import 'services/auth_service.dart';
import 'theme/app_theme.dart';

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
      builder: (context, currentMode, _) {
        return MaterialApp(
          title: 'Cygnet.One',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: currentMode,
          home: const SplashScreen(),
        );
      },
    );
  }
}

/// Splash screen that checks for existing session before showing login
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _checkExistingSession();
  }

  Future<void> _checkExistingSession() async {
    try {
      final token = await _authService.getToken();

      if (token != null && !_authService.isTokenExpired(token)) {
        // Valid token exists — decode role and navigate to dashboard
        final userRoleData = await _authService.getCurrentUserRole();

        if (userRoleData != null && mounted) {
          final role = (userRoleData['role'] ?? 'EMPLOYEE').toString().toUpperCase();

          // Try to fetch full profile
          String name = userRoleData['sub'] ?? 'User';
          Map<String, dynamic>? profile;
          try {
            profile = await _authService.getUserProfile();
            if (profile != null && profile['full_name'] != null) {
              name = profile['full_name'];
            }
          } catch (_) {
            // Fallback to name from token
          }

          if (!mounted) return;

          if (role == 'MANAGER' || role == 'ADMIN' || role == 'SUPER_ADMIN') {
            final Map<String, dynamic> finalProfile = profile ?? {
              'full_name': name,
              'role': role,
              'email': userRoleData['sub'] ?? '',
            };
            if (finalProfile['full_name'] == null) finalProfile['full_name'] = name;

            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => ManagerDashboard(
                  userProfile: finalProfile,
                  onToggleTheme: _toggleTheme,
                ),
              ),
            );
          } else {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => EmployeeDashboard(
                  userName: name,
                  onToggleTheme: _toggleTheme,
                  isDark: themeNotifier.value == ThemeMode.dark,
                ),
              ),
            );
          }
          return;
        }
      }
    } catch (e) {
      debugPrint('Session check failed: $e');
    }

    // No valid session — show login page
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => LoginPage(
            onToggleTheme: _toggleTheme,
            isDark: themeNotifier.value == ThemeMode.dark,
          ),
        ),
      );
    }
  }

  void _toggleTheme() {
    themeNotifier.value = themeNotifier.value == ThemeMode.light
        ? ThemeMode.dark
        : ThemeMode.light;
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFFF8FAFC),
      body: Center(
        child: CircularProgressIndicator(
          color: Color(0xFF1A367C),
        ),
      ),
    );
  }
}
