import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class CafeteriaService {
  static const String baseUrl = 'http://127.0.0.1:8000/api/v1';

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token') ?? '';
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // ==================== FOOD ITEMS ====================

  /// Fetch available food items from the menu
  Future<Map<String, dynamic>> getFoodItems({
    String? category,
    bool? isAvailable = true,
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = <String, String>{
        'page': page.toString(),
        'page_size': pageSize.toString(),
      };
      if (isAvailable != null) queryParams['is_available'] = isAvailable.toString();
      if (category != null) queryParams['category'] = category;

      final uri = Uri.parse('$baseUrl/food-orders/items').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data'] ?? [], 'total': data['total'] ?? 0};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch food items'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // ==================== FOOD ORDERS ====================

  /// Place a food order with cart items
  Future<Map<String, dynamic>> createFoodOrder({
    required List<Map<String, dynamic>> items,
    String? notes,
  }) async {
    try {
      final headers = await _getHeaders();
      final body = json.encode({
        'items': items.map((item) => {
          'food_item_id': item['food_item_id'],
          'quantity': item['quantity'],
        }).toList(),
        if (notes != null) 'notes': notes,
      });

      final response = await http.post(
        Uri.parse('$baseUrl/food-orders/orders'),
        headers: headers,
        body: body,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to create order'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Get current user's food orders
  Future<Map<String, dynamic>> getMyOrders({int page = 1, int pageSize = 20}) async {
    try {
      final headers = await _getHeaders();
      final uri = Uri.parse('$baseUrl/food-orders/my-orders').replace(queryParameters: {
        'page': page.toString(),
        'page_size': pageSize.toString(),
      });
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data'] ?? [], 'total': data['total'] ?? 0};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch orders'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // ==================== CAFETERIA TABLES ====================

  /// Fetch all cafeteria tables
  Future<Map<String, dynamic>> getCafeteriaTables({
    bool? isActive = true,
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = <String, String>{
        'page': page.toString(),
        'page_size': pageSize.toString(),
      };
      if (isActive != null) queryParams['is_active'] = isActive.toString();

      final uri = Uri.parse('$baseUrl/cafeteria/tables').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data'] ?? []};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch tables'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // ==================== TABLE BOOKINGS ====================

  /// Create a cafeteria table booking
  Future<Map<String, dynamic>> createTableBooking({
    required String tableId,
    required String bookingDate,
    required String startTime,
    required String endTime,
    int guestCount = 1,
    String? notes,
  }) async {
    try {
      final headers = await _getHeaders();
      final body = json.encode({
        'table_id': tableId,
        'booking_date': bookingDate,
        'start_time': startTime,
        'end_time': endTime,
        'guest_count': guestCount,
        if (notes != null) 'notes': notes,
      });

      final response = await http.post(
        Uri.parse('$baseUrl/cafeteria/bookings'),
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

  /// Get today's bookings (to determine which tables are booked)
  Future<Map<String, dynamic>> getTodaysBookings() async {
    try {
      final headers = await _getHeaders();
      final today = DateTime.now().toIso8601String().split('T')[0];
      final uri = Uri.parse('$baseUrl/cafeteria/bookings').replace(queryParameters: {
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

  /// Get current user's bookings
  Future<Map<String, dynamic>> getMyBookings() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/cafeteria/bookings/my'),
        headers: headers,
      );

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
}
