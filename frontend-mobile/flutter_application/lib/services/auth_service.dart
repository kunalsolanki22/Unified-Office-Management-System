import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  // Use http://10.0.2.2:8000 for Android emulator
  // Use http://127.0.0.1:8000 for Linux/Web
  static const String baseUrl = 'http://127.0.0.1:8000/api/v1';

  Future<String> changePasswordWithEmail(
      String email, String oldPassword, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/change-password'),
        headers: const {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'old_password': oldPassword,
          'new_password': newPassword,
        }),
      );

      if (response.statusCode == 200) {
        return 'success';
      } else {
        final errorData = json.decode(response.body);
        return errorData['detail'] ?? 'Failed to change password';
      }
    } catch (e) {
      return 'Connection error: $e';
    }
  }

  Future<String> changePassword(String oldPassword, String newPassword) async {
    final token = await getToken();
    if (token == null) {
      return 'Not authenticated. Please login again.';
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/change-password'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'old_password': oldPassword,
          'new_password': newPassword,
        }),
      );

      if (response.statusCode == 200) {
        return 'success';
      } else {
        final errorData = json.decode(response.body);
        return errorData['detail'] ?? 'Failed to change password';
      }
    } catch (e) {
      return 'Connection error: $e';
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: const {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final loginResponse = data['data'];
        final String accessToken = loginResponse['access_token'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', accessToken);

        return {'success': true, 'data': loginResponse};
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'message': errorData['detail'] ?? 'Login failed',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<Map<String, dynamic>?> getCurrentUserRole() async {
    final token = await getToken();
    if (token != null && !JwtDecoder.isExpired(token)) {
      try {
        return JwtDecoder.decode(token);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  Future<Map<String, dynamic>?> getUserProfile() async {
    final token = await getToken();
    if (token == null) return null;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'];
      }
    } catch (e) {
      print('Error fetching profile: $e');
    }
    return null;
  }

  bool isTokenExpired(String token) {
    return JwtDecoder.isExpired(token);
  }
}
