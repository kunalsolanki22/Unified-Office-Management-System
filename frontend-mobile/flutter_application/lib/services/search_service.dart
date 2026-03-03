import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class SearchService {
  static const String baseUrl = 'http://127.0.0.1:8000/api/v1';

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token') ?? '';
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> semanticSearch({
    required String query,
    required String searchType, // 'food' or 'it_assets'
    int limit = 10,
  }) async {
    try {
      final headers = await _getHeaders();
      final reqBody = {
        'query': query,
        'domain': searchType, // backend expects 'domain'
        'limit': limit,
      };
      final body = json.encode(reqBody);
      print('SemanticSearch request: $body');
      final response = await http.post(
        Uri.parse('$baseUrl/search'),
        headers: headers,
        body: body,
      );
      print('SemanticSearch response: ${response.statusCode} ${response.body}');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'message': errorData['detail'] ?? 'Semantic search failed',
        };
      }
    } catch (e) {
      print('SemanticSearch error: $e');
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
}
