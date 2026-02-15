import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ITRequestService {
  static const String baseUrl = 'http://127.0.0.1:8000/api/v1';

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token') ?? '';
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Get list of IT requests (user sees own requests)
  Future<Map<String, dynamic>> getMyRequests({
    int page = 1,
    int pageSize = 20,
    String? status,
    String? requestType,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = <String, String>{
        'page': page.toString(),
        'page_size': pageSize.toString(),
      };
      if (status != null) queryParams['status'] = status;
      if (requestType != null) queryParams['request_type'] = requestType;

      final uri = Uri.parse('$baseUrl/it-requests').replace(queryParameters: queryParams);
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
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch requests'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Create a new IT request (support ticket or hardware request)
  Future<Map<String, dynamic>> createRequest({
    required String requestType, // e.g. 'NEW_ASSET', 'REPAIR', etc.
    required String title,
    required String description,
    String priority = 'MEDIUM',
    String? relatedAssetCode,
  }) async {
    try {
      final headers = await _getHeaders();
      // Ensure enums are lowercase and only send related_asset_code if not empty
      final reqBody = {
        'request_type': requestType.toLowerCase(),
        'title': title,
        'description': description,
        'priority': priority.toLowerCase(),
      };
      if (relatedAssetCode != null && relatedAssetCode.trim().isNotEmpty) {
        reqBody['related_asset_code'] = relatedAssetCode.trim();
      }
      final body = json.encode(reqBody);
      // Debug log
      print('ITRequestService.createRequest: $body');

      final response = await http.post(
        Uri.parse('$baseUrl/it-requests'),
        headers: headers,
        body: body,
      );
      print('ITRequestService.createRequest response: ${response.statusCode} ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        String errorMsg = 'Failed to create request';
        try {
          final errorData = json.decode(response.body);
          if (response.statusCode == 422 && errorData is Map && errorData.containsKey('detail')) {
            final detail = errorData['detail'];
            if (detail is List && detail.isNotEmpty) {
              // Show the full error object for debugging
              errorMsg = detail.map((e) => e.toString()).join('\n');
            } else {
              errorMsg = errorData['detail'].toString();
            }
          } else if (errorData['detail'] != null) {
            errorMsg = errorData['detail'].toString();
          }
        } catch (e) {
          errorMsg = 'Failed to create request: $e';
        }
        return {'success': false, 'message': errorMsg};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Get a specific IT request by ID
  Future<Map<String, dynamic>> getRequestById(String requestId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/it-requests/$requestId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to fetch request'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Approve or reject an IT request (IT Manager only)
  Future<Map<String, dynamic>> approveRequest({
    required String requestId,
    required String action, // 'approve' or 'reject'
    String? notes,
    String? assignedToCode,
    String? rejectionReason,
  }) async {
    try {
      final headers = await _getHeaders();
      final body = <String, dynamic>{
        'action': action,
      };
      if (notes != null) body['notes'] = notes;
      if (assignedToCode != null) body['assigned_to_code'] = assignedToCode;
      if (rejectionReason != null) body['rejection_reason'] = rejectionReason;

      final response = await http.post(
        Uri.parse('$baseUrl/it-requests/$requestId/approve'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to approve/reject request'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  /// Delete/cancel an IT request
  Future<Map<String, dynamic>> deleteRequest(String requestId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl/it-requests/$requestId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data['data']};
      } else {
        final errorData = json.decode(response.body);
        return {'success': false, 'message': errorData['detail'] ?? 'Failed to delete request'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }
}
