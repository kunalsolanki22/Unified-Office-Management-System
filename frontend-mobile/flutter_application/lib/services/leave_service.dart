import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class LeaveService {
  static const String baseUrl = 'http://127.0.0.1:8000/api/v1';

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token') ?? '';
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Get current user's leave balance for a year
  /// Returns a list of balances for each leave type
  Future<Map<String, dynamic>> getMyLeaveBalance({int? year}) async {
    try {
      final headers = await _getHeaders();
      final queryParams = <String, String>{};
      if (year != null) queryParams['year'] = year.toString();

      final uri = Uri.parse('$baseUrl/leave/balance').replace(
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data'] ?? []};
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['detail'] ?? 'Failed to fetch leave balance'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  /// Get current user's leave requests with optional filters
  Future<Map<String, dynamic>> getMyLeaveRequests({
    int page = 1,
    int pageSize = 20,
    String? status,
    String? leaveType,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = <String, String>{
        'page': page.toString(),
        'page_size': pageSize.toString(),
      };
      if (status != null) queryParams['status'] = status;
      if (leaveType != null) queryParams['leave_type'] = leaveType;
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;

      final uri =
          Uri.parse('$baseUrl/leave/requests').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? [],
          'total': data['total'] ?? 0,
          'page': data['page'] ?? page,
          'page_size': data['page_size'] ?? pageSize,
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['detail'] ?? 'Failed to fetch leave requests'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  /// Get a specific leave request by ID
  Future<Map<String, dynamic>> getLeaveRequest(String requestId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/leave/requests/$requestId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['detail'] ?? 'Failed to fetch leave request'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  /// Create a new leave request
  /// Leave types: sick, casual, annual, unpaid, maternity, paternity, bereavement
  Future<Map<String, dynamic>> createLeaveRequest({
    required String leaveType,
    required String startDate,
    required String endDate,
    String? reason,
    bool isHalfDay = false,
    String? halfDayType, // 'first_half' or 'second_half'
    String? emergencyContact,
    String? emergencyPhone,
  }) async {
    try {
      final headers = await _getHeaders();
      final body = <String, dynamic>{
        'leave_type': leaveType.toLowerCase(),
        'start_date': startDate,
        'end_date': endDate,
        'is_half_day': isHalfDay,
      };
      
      if (reason != null && reason.isNotEmpty) {
        body['reason'] = reason;
      }
      if (isHalfDay && halfDayType != null) {
        body['half_day_type'] = halfDayType.toLowerCase();
      }
      if (emergencyContact != null && emergencyContact.isNotEmpty) {
        body['emergency_contact'] = emergencyContact;
      }
      if (emergencyPhone != null && emergencyPhone.isNotEmpty) {
        body['emergency_phone'] = emergencyPhone;
      }

      final response = await http.post(
        Uri.parse('$baseUrl/leave/requests'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['detail'] ?? 'Failed to create leave request'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  /// Cancel a leave request
  Future<Map<String, dynamic>> cancelLeaveRequest(String requestId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/leave/requests/$requestId/cancel'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['detail'] ?? 'Failed to cancel leave request'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  /// Approve leave request - Level 1 (Team Lead)
  Future<Map<String, dynamic>> approveLevel1({
    required String requestId,
    required String action, // 'approve' or 'reject'
    String? notes,
    String? rejectionReason,
  }) async {
    try {
      final headers = await _getHeaders();
      final body = <String, dynamic>{
        'action': action,
      };
      if (notes != null) body['notes'] = notes;
      if (rejectionReason != null) body['rejection_reason'] = rejectionReason;

      final response = await http.post(
        Uri.parse('$baseUrl/leave/requests/$requestId/approve-level1'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['detail'] ?? 'Failed to process leave request'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  /// Approve leave request - Final (Manager)
  Future<Map<String, dynamic>> approveFinal({
    required String requestId,
    required String action, // 'approve' or 'reject'
    String? notes,
    String? rejectionReason,
  }) async {
    try {
      final headers = await _getHeaders();
      final body = <String, dynamic>{
        'action': action,
      };
      if (notes != null) body['notes'] = notes;
      if (rejectionReason != null) body['rejection_reason'] = rejectionReason;

      final response = await http.post(
        Uri.parse('$baseUrl/leave/requests/$requestId/approve-final'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['detail'] ?? 'Failed to process leave request'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }

  /// Get leave balance for a specific user (Admin+ only)
  Future<Map<String, dynamic>> getUserLeaveBalance(String userId, {int? year}) async {
    try {
      final headers = await _getHeaders();
      final queryParams = <String, String>{};
      if (year != null) queryParams['year'] = year.toString();

      final uri = Uri.parse('$baseUrl/leave/balance/$userId').replace(
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data'] ?? []};
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['detail'] ?? 'Failed to fetch user leave balance'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: $e'};
    }
  }
}
