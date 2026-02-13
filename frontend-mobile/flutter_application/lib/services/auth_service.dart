import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  // Use http://10.0.2.2:8000 for Android emulator
  // Use http://127.0.0.1:8000 for web/iOS simulator
  // Use your machine's IP address for physical devices
  static const String baseUrl = 'http://127.0.0.1:8000/api/v1'; 

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        // Access token is inside 'data' key based on APIResponse wrapper
        final loginResponse = data['data'];
        final String accessToken = loginResponse['access_token'];

        // Store token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', accessToken);

        return {'success': true, 'data': loginResponse};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Login failed'};
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
        final decodedToken = JwtDecoder.decode(token);
        return decodedToken;
      } catch (e) {
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
        // The API returns { "data": { ...user_info... }, "message": "..." }
        if (data['data'] != null) {
           return data['data'];
        }
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
