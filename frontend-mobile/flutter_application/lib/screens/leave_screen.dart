import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../utils/snackbar_helper.dart';
import '../services/leave_service.dart';
import 'package:calendar_date_picker2/calendar_date_picker2.dart';

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _reasonController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final LeaveService _leaveService = LeaveService();

  // Dynamic data from API
  List<dynamic> _leaveBalances = [];
  List<dynamic> _leaveRequests = [];
  bool _isLoadingBalance = true;
  bool _isLoadingRequests = true;
  bool _isSubmitting = false;

  // Date selection (FROM and TO)
  DateTime? _startDate;
  DateTime? _endDate;

  // Removed half day options

  // Leave type selection - matching backend enums
  String _selectedLeaveType = 'casual';
  final List<Map<String, String>> _leaveTypes = [
    {'value': 'casual', 'label': 'Casual Leave'},
    {'value': 'sick', 'label': 'Sick Leave'},
    {'value': 'annual', 'label': 'Annual Leave'},
    {'value': 'unpaid', 'label': 'Unpaid Leave'},
    {'value': 'maternity', 'label': 'Maternity Leave'},
    {'value': 'paternity', 'label': 'Paternity Leave'},
    {'value': 'bereavement', 'label': 'Bereavement Leave'},
  ];

  // Add this to store selected range
  List<DateTime?> _selectedRange = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    await Future.wait([
      _loadLeaveBalance(),
      _loadLeaveRequests(),
    ]);
  }

  Future<void> _loadLeaveBalance() async {
    setState(() => _isLoadingBalance = true);

    final result = await _leaveService.getMyLeaveBalance();

    if (mounted) {
      setState(() {
        if (result['success'] == true) {
          _leaveBalances = result['data'] ?? [];
        }
        _isLoadingBalance = false;
      });
    }
  }

  // Moved _buildApplyForm here as a class method
  Widget _buildApplyForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Leave Type Dropdown
        DropdownButtonFormField<String>(
          initialValue: _selectedLeaveType,
          decoration: const InputDecoration(
            labelText: 'Leave Type',
            border: OutlineInputBorder(),
          ),
          items: _leaveTypes
              .map((type) => DropdownMenuItem<String>(
                    value: type['value'],
                    child: Text(type['label'] ?? ''),
                  ))
              .toList(),
          onChanged: (value) {
            setState(() {
              _selectedLeaveType = value ?? 'casual';
            });
          },
        ),
        const SizedBox(height: 16),
        // Reason Text Field
        TextFormField(
          controller: _reasonController,
          maxLines: 2,
          decoration: const InputDecoration(
            labelText: 'Reason (optional)',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        const SizedBox(height: 24),
        // Submit Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _submitLeaveRequest,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A237E),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: _isSubmitting
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Text(
                    'Submit Leave Request',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
          ),
        ),
      ],
    );
  }

  Future<void> _loadLeaveRequests() async {
    setState(() => _isLoadingRequests = true);

    final result = await _leaveService.getMyLeaveRequests();

    if (mounted) {
      setState(() {
        if (result['success'] == true) {
          _leaveRequests = result['data'] ?? [];
        }
        _isLoadingRequests = false;
      });
    }
  }

  String _formatDate(DateTime date) {
    return DateFormat('yyyy-MM-dd').format(date);
  }

  String _formatDisplayDate(DateTime date) {
    return DateFormat('dd MMM yyyy').format(date);
  }

  Future<void> _selectStartDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF1A237E),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _startDate = picked;
        // If end date is before start date, reset it
        if (_endDate != null && _endDate!.isBefore(picked)) {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _selectEndDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? _startDate ?? DateTime.now(),
      firstDate: _startDate ?? DateTime.now(),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF1A237E),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _endDate = picked;
      });
    }
  }

  int _calculateLeaveDays() {
    if (_startDate == null || _endDate == null) return 0;
    int days = _endDate!.difference(_startDate!).inDays + 1;
    // Removed half day logic
    return days;
  }

  Future<void> _submitLeaveRequest() async {
    // Validation
    if (_startDate == null) {
      SnackbarHelper.showError(context, 'Please select a start date (FROM)');
      return;
    }
    if (_endDate == null) {
      SnackbarHelper.showError(context, 'Please select an end date (TO)');
      return;
    }
    setState(() => _isSubmitting = true);

    final result = await _leaveService.createLeaveRequest(
      leaveType: _selectedLeaveType,
      startDate: _formatDate(_startDate!),
      endDate: _formatDate(_endDate!),
      reason: _reasonController.text.trim().isNotEmpty
          ? _reasonController.text.trim()
          : null,
      // Removed isHalfDay and halfDayType
    );

    if (!mounted) return;

    setState(() => _isSubmitting = false);

    if (result['success'] == true) {
      SnackbarHelper.showSuccess(context, 'Leave request submitted successfully');
      // Reset form
      setState(() {
        _startDate = null;
        _endDate = null;
        _reasonController.clear();
      });
      // Refresh data
      _loadData();
    } else {
      SnackbarHelper.showError(
          context, result['error'] ?? 'Failed to submit request');
    }
  }

  Future<void> _cancelLeaveRequest(String requestId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Leave Request'),
        content: const Text('Are you sure you want to cancel this leave request?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final result = await _leaveService.cancelLeaveRequest(requestId);

    if (!mounted) return;

    if (result['success'] == true) {
      SnackbarHelper.showSuccess(context, 'Leave request cancelled');
      await _loadLeaveRequests();
      await _loadLeaveBalance(); // Refresh leave balance after cancel
    } else {
      SnackbarHelper.showError(
          context, result['error'] ?? 'Failed to cancel request');
    }
  }

  void _showLeaveBalanceDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave Balance'),
        content: _isLoadingBalance
            ? const SizedBox(height: 60, child: Center(child: CircularProgressIndicator()))
            : _leaveBalances.isEmpty
                ? const Text('No leave balance data available')
                : SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('Type')),
                        DataColumn(label: Text('Available')),
                        DataColumn(label: Text('Total')),
                      ],
                      rows: _leaveBalances
                          .where((balance) => (balance['leave_type']?.toString().toLowerCase() ?? '') != 'unpaid')
                          .map<DataRow>((balance) {
                        final leaveType = balance['leave_type']?.toString().toUpperCase() ?? 'N/A';
                        final available = double.tryParse(balance['available_days'].toString())?.toInt() ?? 0;
                        final total = double.tryParse(balance['total_days'].toString())?.toInt() ?? 0;
                        return DataRow(cells: [
                          DataCell(Text(leaveType)),
                          DataCell(Text(available.toString())),
                          DataCell(Text(total.toString())),
                        ]);
                      }).toList(),
                    ),
                  ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _reasonController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Tab Bar
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _tabController,
            labelColor: const Color(0xFF1A237E),
            unselectedLabelColor: Colors.grey,
            indicatorColor: const Color(0xFF1A237E),
            tabs: const [
              Tab(text: 'Apply Leave'),
              Tab(text: 'My Requests'),
            ],
          ),
        ),
        // Tab Views
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildApplyLeaveTab(),
              _buildMyRequestsTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildApplyLeaveTab() {
    return Scrollbar(
      controller: _scrollController,
      thumbVisibility: true,
      trackVisibility: true,
      interactive: true,
      thickness: 8.0,
      radius: const Radius.circular(8),
      child: SingleChildScrollView(
        controller: _scrollController,
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'LEAVE REQUEST',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A237E),
                letterSpacing: 1.0,
              ),
            ),
            const SizedBox(height: 16),
            // Calendar range picker
              CalendarDatePicker2(
                config: CalendarDatePicker2Config(
                  calendarType: CalendarDatePicker2Type.range,
                  firstDate: DateTime.now(),
                  lastDate: DateTime(2030),
                  selectedDayHighlightColor: const Color(0xFF1A237E),
                  selectedDayTextStyle: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                value: _selectedRange,
                onValueChanged: (dates) {
                  setState(() {
                    _selectedRange = dates;
                    if (dates.isNotEmpty) _startDate = dates[0];
                    if (dates.length > 1) _endDate = dates[1];
                  });
                },
              ),
            const SizedBox(height: 12),
            // Show selected dates in boxes
            if (_startDate != null && _endDate != null) ...[
              Row(
                children: [
                  Expanded(
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('FROM', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          const SizedBox(height: 4),
                          Text(_formatDisplayDate(_startDate!), style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      margin: const EdgeInsets.only(left: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('TO', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          const SizedBox(height: 4),
                          Text(_formatDisplayDate(_endDate!), style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 24),
            _buildApplyForm(),
            const SizedBox(height: 16),
            // Leave balance button after submit
            if (!_isSubmitting)
              Center(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.account_balance_wallet_outlined),
                  label: const Text('Show Leave Balance'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF1A237E),
                    side: const BorderSide(color: Color(0xFF1A237E)),
                  ),
                  onPressed: _showLeaveBalanceDialog,
                ),
              ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Widget _buildMyRequestsTab() {
    return RefreshIndicator(
      onRefresh: _loadLeaveRequests,
      child: _isLoadingRequests
          ? const Center(child: CircularProgressIndicator())
          : _leaveRequests.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.event_busy, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No leave requests yet',
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
                  itemCount: _leaveRequests.length,
                  itemBuilder: (context, index) {
                    final request = _leaveRequests[index];
                    return _buildRequestCard(request);
                  },
                ),
    );
  }

  Widget _buildRequestCard(Map<String, dynamic> request) {
    final status = request['status']?.toString() ?? 'unknown';
    final leaveType = request['leave_type']?.toString().toUpperCase() ?? 'N/A';
    final startDate = request['start_date'] ?? '';
    final endDate = request['end_date'] ?? '';
    final totalDays = double.tryParse(request['total_days'].toString())?.toInt() ?? 0;
    final reason = request['reason'] ?? '';
    // Removed isHalfDay
    final requestId = request['id']?.toString() ?? '';

    Color statusColor;
    String statusText;
    IconData statusIcon;

    switch (status.toLowerCase()) {
      case 'pending':
      case 'pending_level1':
        statusColor = Colors.orange;
        statusText = 'Pending';
        statusIcon = Icons.hourglass_empty;
        break;
      case 'approved_level1':
        statusColor = Colors.blue;
        statusText = 'Level 1 Approved';
        statusIcon = Icons.check;
        break;
      case 'approved':
      case 'approved_final':
        statusColor = Colors.green;
        statusText = 'Approved';
        statusIcon = Icons.check_circle;
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusText = 'Rejected';
        statusIcon = Icons.cancel;
        break;
      case 'cancelled':
        statusColor = Colors.grey;
        statusText = 'Cancelled';
        statusIcon = Icons.block;
        break;
      default:
        statusColor = Colors.grey;
        statusText = status;
        statusIcon = Icons.help_outline;
    }

    final canCancel = status.toLowerCase() == 'pending' ||
        status.toLowerCase() == 'pending_level1';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  leaveType,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A237E),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 14, color: statusColor),
                      const SizedBox(width: 4),
                      Text(
                        statusText,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Date range
            Row(
              children: [
                const Icon(Icons.date_range, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  startDate == endDate
                      ? startDate
                      : '$startDate  →  $endDate',
                  style: const TextStyle(fontSize: 14),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Duration
            Row(
              children: [
                const Icon(Icons.schedule, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  '${totalDays.toString()} day(s)',
                  style: const TextStyle(fontSize: 14),
                ),
              ],
            ),

            // Reason
            if (reason.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.notes, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      reason,
                      style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                    ),
                  ),
                ],
              ),
            ],

            // Cancel button
            if (canCancel) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => _cancelLeaveRequest(requestId),
                  icon: const Icon(Icons.cancel_outlined, size: 18),
                  label: const Text('Cancel Request'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}