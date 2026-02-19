import 'package:flutter/material.dart';
import '../../services/leave_service.dart';
import '../../utils/snackbar_helper.dart';
import 'package:intl/intl.dart';

class LeaveReviewScreen extends StatefulWidget {
  const LeaveReviewScreen({super.key});

  @override
  State<LeaveReviewScreen> createState() => _LeaveReviewScreenState();
}

class _LeaveReviewScreenState extends State<LeaveReviewScreen> {
  final LeaveService _leaveService = LeaveService();
  bool _isLoading = true;
  List<dynamic> _pendingRequests = [];

  @override
  void initState() {
    super.initState();
    _loadPendingRequests();
  }

  Future<void> _loadPendingRequests() async {
    setState(() => _isLoading = true);
    // Fetch only pending requests
    final result = await _leaveService.getLeaveRequests(status: 'PENDING');
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result['success']) {
          _pendingRequests = result['data'];
        } else {
          _pendingRequests = [];
          SnackbarHelper.showError(context, result['error'] ?? 'Failed to load requests');
        }
      });
    }
  }

  Future<void> _approveRequest(String id, bool isFinal) async {
    // Determine if it's Level 1 or Final based on... generally Manager is final, Team Lead is level 1. 
    // For simplicity in this mobile app, we assume the user has the right permission.
    // The backend handles the permission check. 
    // As a manager, you likely do final approval. 
    // However, if the request is PENDING_LEVEL1, it needs level 1 approval.
    // Ideally we should check the status of the request.
    
    // Let's check the request status from the list
    final request = _pendingRequests.firstWhere((r) => r['id'] == id, orElse: () => null);
    if (request == null) return;

    final status = (request['status'] ?? '').toString().toUpperCase();
    final action = 'approve';
    
    Map<String, dynamic> result;
    if (status == 'PENDING' || status == 'PENDING_LEVEL1') {
       // Try Level 1 first. If user is Manager, they might be able to do Final directly?
       // The backend `approve_leave_final` requires `require_manager_or_above`.
       // `approve_leave_level1` requires `require_team_lead_or_above`.
       
       // If I am a Manager, I can probably do both, but flow matters.
       // Let's try Final approval first if I am a Manager? 
       // Or simpler: Just use Final Approval if status is APPROVED_LEVEL1?
       
       // Actually, usually:
       // PENDING -> Level 1 Approve -> APPROVED_LEVEL1 -> Final Approve -> APPROVED
       
       if (status == 'APPROVED_LEVEL1') {
         result = await _leaveService.approveFinal(requestId: id, action: action);
       } else {
         // It's just PENDING. 
         // If I am a Manager, do I do Level 1 or Final?
         // Let's assume standard flow.
         result = await _leaveService.approveLevel1(requestId: id, action: action);
       }
    } else {
       // Default to Level 1
       result = await _leaveService.approveLevel1(requestId: id, action: action);
    }

    if (mounted) {
      if (result['success']) {
        SnackbarHelper.showSuccess(context, 'Leave request approved successfully');
        _loadPendingRequests();
      } else {
        // If Level 1 fails, maybe try Final (e.g. if I am Manager skipping a step?)
        // Or show the error.
        SnackbarHelper.showError(context, result['error'] ?? 'Failed to approve');
      }
    }
  }

  Future<void> _rejectRequest(String id) async {
    final reasonController = TextEditingController();
    final shouldReject = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Leave Request'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(
            labelText: 'Reason for rejection',
            hintText: 'Enter reason...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (reasonController.text.trim().isEmpty) {
                SnackbarHelper.showError(context, 'Reason is required');
                return;
              }
              Navigator.pop(context, true);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (shouldReject == true && mounted) {
      // Rejecting can be done via approveLevel1 or approveFinal with action='reject'.
      // Let's use Level 1 rejection as it's safer/generic.
      final result = await _leaveService.approveLevel1(
        requestId: id, 
        action: 'reject', 
        rejectionReason: reasonController.text.trim()
      );
      
      if (mounted) {
        if (result['success']) {
          SnackbarHelper.showSuccess(context, 'Leave request rejected');
          _loadPendingRequests();
        } else {
          SnackbarHelper.showError(context, result['error'] ?? 'Failed to reject');
        }
      }
    }
  }

  String _formatDate(String? isoString) {
    if (isoString == null) return '';
    try {
      final dt = DateTime.parse(isoString);
      return DateFormat('MMM d, y').format(dt);
    } catch (e) {
      return isoString;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Leave Review',
          style: TextStyle(color: Color(0xFF1A1A2E)), 
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A1A2E)),
      ),
      backgroundColor: const Color(0xFFF5F7FA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _pendingRequests.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.event_available, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No pending leave requests',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _pendingRequests.length,
                  itemBuilder: (context, index) {
                    final req = _pendingRequests[index];
                    final userCode = req['user_code'] ?? 'Unknown'; // User details might need a separate fetch or backend include
                    // Currently list_leave_requests returns LeaveRequestResponse which has user_code but not full user object unless modified.
                    // The backend `build_leave_request_response` currently only returns `user_code`.
                    // We will display User Code for now.
                    
                    final type = (req['leave_type'] ?? 'Unknown').toString().toUpperCase();
                    final startDate = _formatDate(req['start_date']);
                    final endDate = _formatDate(req['end_date']);
                    final days = req['total_days']?.toString() ?? '1';
                    final reason = req['reason'] ?? 'No reason provided';
                    final status = req['status'] ?? 'PENDING';

                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    type,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                      color: Color(0xFF1A1A2E),
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.orange.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.orange),
                                  ),
                                  child: Text(
                                    status,
                                    style: const TextStyle(
                                      color: Colors.orange,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('User: $userCode', style: TextStyle(fontWeight: FontWeight.w500, color: Colors.grey[800])),
                            const SizedBox(height: 4),
                            Text('$startDate - $endDate ($days days)', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                            if (reason.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(
                                '"$reason"',
                                style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey[600]),
                              ),
                            ],
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () => _rejectRequest(req['id']),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.red,
                                      side: const BorderSide(color: Colors.red),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: const Text('Reject'),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () => _approveRequest(req['id'], false),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF1A1A2E),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: const Text('Approve'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
