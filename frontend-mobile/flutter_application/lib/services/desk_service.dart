import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class DeskService {
  static const String baseUrl = 'http://127.0.0.1:8000/api/v1';

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token') ?? '';
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // ==================== DESK APIs ====================

  /// Get list of desks
  Future<Map<String, dynamic>> getDesks({
    int page = 1,
    int pageSize = 100,
    String? status,
    bool isActive = true,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = <String, String>{
        'page': page.toString(),
        'page_size': pageSize.toString(),
        'is_active': isActive.toString(),
      };
      if (status != null) queryParams['status'] = status;

      final uri = Uri.parse('$baseUrl/desks').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? [],
          'total': data['total'] ?? 0,
        };
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch desks'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Get today's desk bookings
  Future<Map<String, dynamic>> getTodaysBookings() async {
    try {
      final headers = await _getHeaders();
      final today = DateTime.now().toIso8601String().split('T')[0];
      final uri = Uri.parse('$baseUrl/desks/bookings').replace(queryParameters: {
        'booking_date': today,
        'page_size': '100',
      });
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data'] ?? []};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch bookings'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Get current user's desk bookings
  Future<Map<String, dynamic>> getMyBookings() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/desks/bookings/my'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data'] ?? []};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch my bookings'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Create a desk booking
  Future<Map<String, dynamic>> createDeskBooking({
    required String deskId,
    required String bookingDate, // YYYY-MM-DD
    required String startTime,   // HH:MM:SS
    required String endTime,     // HH:MM:SS
    String? purpose,
  }) async {
    try {
      final headers = await _getHeaders();
      final body = json.encode({
        'desk_id': deskId,
        'booking_date': bookingDate,
        'start_time': startTime,
        'end_time': endTime,
        if (purpose != null) 'purpose': purpose,
      });

      final response = await http.post(
        Uri.parse('$baseUrl/desks/bookings'),
        headers: headers,
        body: body,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to create booking'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Cancel a desk booking
  Future<Map<String, dynamic>> cancelDeskBooking(String bookingId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/desks/bookings/$bookingId/cancel'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to cancel booking'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // ==================== CONFERENCE ROOM APIs ====================

  /// Get list of conference rooms
  Future<Map<String, dynamic>> getConferenceRooms({
    int page = 1,
    int pageSize = 50,
    bool isActive = true,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = <String, String>{
        'page': page.toString(),
        'page_size': pageSize.toString(),
        'is_active': isActive.toString(),
      };

      final uri = Uri.parse('$baseUrl/desks/rooms').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? [],
          'total': data['total'] ?? 0,
        };
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch rooms'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Get conference room bookings for today
  Future<Map<String, dynamic>> getTodaysRoomBookings() async {
    try {
      final headers = await _getHeaders();
      final today = DateTime.now().toIso8601String().split('T')[0];
      final uri = Uri.parse('$baseUrl/desks/rooms/bookings').replace(queryParameters: {
        'booking_date': today,
        'page_size': '100',
      });
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data'] ?? []};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch room bookings'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Create a conference room booking
  Future<Map<String, dynamic>> createRoomBooking({
    required String roomId,
    required String bookingDate, // YYYY-MM-DD
    required String startTime,   // HH:MM:SS
    required String endTime,     // HH:MM:SS
    required String meetingTitle,
    String? description,
    int? expectedAttendees,
    List<String>? externalAttendeeEmails,
  }) async {
    try {
      final headers = await _getHeaders();
      final body = json.encode({
        'room_id': roomId,
        'booking_date': bookingDate,
        'start_time': startTime,
        'end_time': endTime,
        'meeting_title': meetingTitle,
        if (description != null) 'description': description,
        if (expectedAttendees != null) 'expected_attendees': expectedAttendees,
        if (externalAttendeeEmails != null) 'external_attendee_emails': externalAttendeeEmails,
      });

      final response = await http.post(
        Uri.parse('$baseUrl/desks/rooms/bookings'),
        headers: headers,
        body: body,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to create room booking'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
}
