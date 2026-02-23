import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ProjectService {
  static const String baseUrl = 'http://127.0.0.1:8000/api/v1';

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token') ?? '';
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Fetch the current user's approved / in-progress projects.
  /// Returns { 'owned_projects': [...], 'member_projects': [...] }
  Future<Map<String, dynamic>> getMyProjects() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/projects/my-projects'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        return {'success': true, 'data': body['data']};
      } else {
        return {'success': false, 'message': 'Failed to load projects'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
}
