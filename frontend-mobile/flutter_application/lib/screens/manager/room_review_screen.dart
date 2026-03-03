import 'package:flutter/material.dart';
import '../../services/desk_service.dart';
import '../../utils/snackbar_helper.dart';
import 'package:intl/intl.dart';

class RoomReviewScreen extends StatefulWidget {
  const RoomReviewScreen({super.key});

  @override
  State<RoomReviewScreen> createState() => _RoomReviewScreenState();
}

class _RoomReviewScreenState extends State<RoomReviewScreen> {
  final DeskService _deskService = DeskService();
  bool _isLoading = true;
  List<dynamic> _pendingRequests = [];

  @override
  void initState() {
    super.initState();
    _loadPendingRequests();
  }

  Future<void> _loadPendingRequests() async {
    setState(() => _isLoading = true);
    final result = await _deskService.getPendingRoomBookings();
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result['success']) {
          _pendingRequests = result['data'];
        } else {
          _pendingRequests = [];
          SnackbarHelper.showError(context, result['message'] ?? 'Failed to load requests');
        }
      });
    }
  }

  Future<void> _approveRequest(String id) async {
    final notesController = TextEditingController();
    final shouldApprove = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Approve Room Request'),
        content: TextField(
          controller: notesController,
          decoration: const InputDecoration(
            labelText: 'Notes (Optional)',
            hintText: 'Add a note for the user...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1A367C)),
            child: const Text('Approve'),
          ),
        ],
      ),
    );

    if (shouldApprove == true && mounted) {
      final result = await _deskService.approveRoomBooking(id, notes: notesController.text.trim());
      if (mounted) {
        if (result['success']) {
          SnackbarHelper.showSuccess(context, 'Room request approved successfully');
          _loadPendingRequests();
        } else {
          SnackbarHelper.showError(context, result['message'] ?? 'Failed to approve');
        }
      }
    }
  }

  Future<void> _rejectRequest(String id) async {
    final reasonController = TextEditingController();
    final shouldReject = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Room Request'),
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
      final result = await _deskService.rejectRoomBooking(id, reasonController.text.trim());
      if (mounted) {
        if (result['success']) {
          SnackbarHelper.showSuccess(context, 'Room request rejected');
          _loadPendingRequests();
        } else {
          SnackbarHelper.showError(context, result['message'] ?? 'Failed to reject');
        }
      }
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('MMM d, y').format(dt);
    } catch (e) {
      return dateStr;
    }
  }

  String _formatTime(String? timeStr) {
    if (timeStr == null) return '';
    // Format HH:MM:SS or HH:MM
    final parts = timeStr.split(':');
    if (parts.length >= 2) {
      return '${parts[0].padLeft(2, '0')}:${parts[1].padLeft(2, '0')}';
    }
    return timeStr;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Room Request Review',
          style: TextStyle(color: Color(0xFF1A367C), fontWeight: FontWeight.bold), 
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1A367C)),
      ),
      backgroundColor: const Color(0xFFF5F7FA),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _pendingRequests.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.meeting_room_outlined, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No pending room requests',
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
                    final userCode = req['user_code'] ?? 'Unknown';
                    final roomLabel = req['room_label'] ?? req['room_code'] ?? 'Unknown Room';
                    final title = req['title'] ?? 'Meeting Room Booking';
                    final date = _formatDate(req['booking_date']);
                    final start = _formatTime(req['start_time']);
                    final end = _formatTime(req['end_time']);
                    final attendees = req['attendees_count']?.toString() ?? '1';
                    final status = req['status'] ?? 'PENDING';

                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 4,
                      shadowColor: Colors.black.withOpacity(0.1),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        title,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 18,
                                          color: Color(0xFF1A367C),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        roomLabel,
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.orange.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.orange.shade200),
                                  ),
                                  child: Text(
                                    status.toUpperCase(),
                                    style: TextStyle(
                                      color: Colors.orange.shade700,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const Divider(height: 32),
                            Row(
                              children: [
                                Icon(Icons.person_outline, size: 16, color: Colors.grey[600]),
                                const SizedBox(width: 8),
                                Text(
                                  'Employee: $userCode',
                                  style: const TextStyle(fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(Icons.calendar_today_outlined, size: 16, color: Colors.grey[600]),
                                const SizedBox(width: 8),
                                Text(
                                  '$date  |  $start - $end',
                                  style: TextStyle(color: Colors.grey[700], fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(Icons.groups_outlined, size: 16, color: Colors.grey[600]),
                                const SizedBox(width: 8),
                                Text(
                                  'Attendees: $attendees',
                                  style: TextStyle(color: Colors.grey[700], fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () => _rejectRequest(req['id']),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.red.shade600,
                                      side: BorderSide(color: Colors.red.shade200),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                    ),
                                    child: const Text('Reject', style: TextStyle(fontWeight: FontWeight.bold)),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () => _approveRequest(req['id']),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF1A367C),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                      elevation: 0,
                                    ),
                                    child: const Text('Approve', style: TextStyle(fontWeight: FontWeight.bold)),
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
