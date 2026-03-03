import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class HolidayService {
  static const String baseUrl = 'http://127.0.0.1:8000/api/v1';

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Fetches holidays from the backend.
  /// [upcomingOnly] - if true, only upcoming holidays are returned.
  /// [year] - optional year filter.
  Future<Map<String, dynamic>> getHolidays({
    bool upcomingOnly = false,
    int? year,
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = {
        'upcoming_only': upcomingOnly.toString(),
        'page': page.toString(),
        'page_size': pageSize.toString(),
      };
      if (year != null) {
        queryParams['year'] = year.toString();
      }

      final uri = Uri.parse('$baseUrl/holidays/list').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data'] ?? [], 'total': data['total'] ?? 0};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch holidays'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
}
