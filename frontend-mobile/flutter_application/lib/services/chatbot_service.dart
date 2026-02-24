import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class ChatbotService {
  // Use http://10.0.2.2:8080 for Android emulator
  // Use http://127.0.0.1:8080 for Linux/Web
  static const String baseUrl = 'http://127.0.0.1:8080/api';
  final AuthService _authService = AuthService();

  Future<Map<String, dynamic>> tokenLogin() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'No authentication token found'};
      }

      final response = await http.post(
        Uri.parse('$baseUrl/auth/token-login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'token': token}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
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

  Future<Map<String, dynamic>> sendMessage(String sessionId, String message) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/chat'),
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: json.encode({'message': message}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'message': errorData['detail'] ?? 'Failed to send message',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  Future<Map<String, dynamic>> getConversations(String sessionId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/conversations'),
        headers: {'X-Session-ID': sessionId},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        return {'success': false, 'message': 'Failed to fetch conversations'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  Future<Map<String, dynamic>> startNewChat(String sessionId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/conversations/new'),
        headers: {'X-Session-ID': sessionId},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        return {'success': false, 'message': 'Failed to start new chat'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  Future<Map<String, dynamic>> loadConversation(String sessionId, String conversationId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/conversations/$conversationId/load'),
        headers: {'X-Session-ID': sessionId},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        return {'success': false, 'message': 'Failed to load conversation'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  Future<Map<String, dynamic>> getConversationMessages(String sessionId, String conversationId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/conversations/$conversationId/messages'),
        headers: {'X-Session-ID': sessionId},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        return {'success': false, 'message': 'Failed to fetch messages'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
}
