import 'package:flutter/material.dart';
import '../utils/snackbar_helper.dart';
import '../services/it_request_service.dart';

class ITSupportScreen extends StatefulWidget {
  const ITSupportScreen({super.key});

  @override
  State<ITSupportScreen> createState() => _ITSupportScreenState();
}

class _ITSupportScreenState extends State<ITSupportScreen> {
  // Design constants
  static const Color navyColor = Color(0xFF1A367C);
  static const Color yellowAccent = Color(0xFFFDBB2D);
  static const Color bgGray = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF8E99A7);

  final ITRequestService _itRequestService = ITRequestService();
  
  // Dynamic data from API
  List<Map<String, dynamic>> _activeRequests = [];
  List<Map<String, dynamic>> _history = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  // Form state
  String? _selectedRequestType;
  String? _selectedPriority = 'medium';
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _assetCodeController = TextEditingController();
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _loadRequests();
  }

  Future<void> _loadRequests() async {
    setState(() => _isLoading = true);
    
    final result = await _itRequestService.getMyRequests(pageSize: 50);
    
    if (mounted && result['success'] == true) {
      final requests = List<Map<String, dynamic>>.from(result['data'] ?? []);
      final active = <Map<String, dynamic>>[];
      final completed = <Map<String, dynamic>>[];
      
      for (final req in requests) {
        final status = (req['status'] ?? '').toString().toUpperCase();
        final mapped = _mapRequestToDisplay(req);
        
        if (status == 'COMPLETED' || status == 'REJECTED' || status == 'CANCELLED') {
          completed.add(mapped);
        } else {
          active.add(mapped);
        }
      }
      
      setState(() {
        _activeRequests = active;
        _history = completed;
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  Map<String, dynamic> _mapRequestToDisplay(Map<String, dynamic> req) {
    final status = (req['status'] ?? 'PENDING').toString().toUpperCase();
    final statusConfig = _getStatusConfig(status);
    final createdAt = req['created_at']?.toString() ?? '';
    
    return {
      'id': req['id'],
      'title': req['title'] ?? 'Untitled Request',
      'status': _formatStatus(status),
      'statusBg': statusConfig['bg'],
      'statusColor': statusConfig['color'],
      'ticketId': req['request_number'] ?? 'IT-0000',
      'date': _formatDate(createdAt),
      'description': req['description'] ?? '',
      'icon': _getRequestIcon(req['request_type']?.toString() ?? ''),
      'resolved': status == 'COMPLETED',
    };
  }

  Map<String, Color> _getStatusConfig(String status) {
    switch (status) {
      case 'PENDING':
        return {'bg': const Color(0xFFFEF3C7), 'color': const Color(0xFFD97706)};
      case 'APPROVED':
        return {'bg': const Color(0xFFDCFCE7), 'color': const Color(0xFF16A34A)};
      case 'IN_PROGRESS':
        return {'bg': const Color(0xFFDBEAFE), 'color': const Color(0xFF2563EB)};
      case 'COMPLETED':
        return {'bg': const Color(0xFFDCFCE7), 'color': const Color(0xFF16A34A)};
      case 'REJECTED':
        return {'bg': const Color(0xFFFEE2E2), 'color': const Color(0xFFDC2626)};
      case 'CANCELLED':
        return {'bg': const Color(0xFFF3F4F6), 'color': const Color(0xFF6B7280)};
      default:
        return {'bg': const Color(0xFFF3F4F6), 'color': const Color(0xFF6B7280)};
    }
  }

  String _formatStatus(String status) {
    return status.replaceAll('_', ' ').split(' ').map((w) => 
      w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}' : ''
    ).join(' ');
  }

  String _formatDate(String isoDate) {
    if (isoDate.isEmpty) return 'Unknown';
    try {
      final date = DateTime.parse(isoDate);
      final now = DateTime.now();
      final diff = now.difference(date);
      
      if (diff.inDays == 0) return 'Today';
      if (diff.inDays == 1) return 'Yesterday';
      if (diff.inDays < 7) return '${diff.inDays} days ago';
      
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[date.month - 1]} ${date.day}';
    } catch (e) {
      return 'Unknown';
    }
  }

  IconData _getRequestIcon(String requestType) {
    switch (requestType.toUpperCase()) {
      case 'HARDWARE':
        return Icons.computer;
      case 'SOFTWARE':
        return Icons.apps;
      case 'NETWORK':
        return Icons.wifi;
      case 'ACCESS':
        return Icons.key;
      default:
        return Icons.support_agent;
    }
  }

  void _openRequestForm() {
    setState(() {
      _showForm = true;
      _selectedRequestType = null;
      _selectedPriority = 'medium';
      _titleController.clear();
      _descriptionController.clear();
      _assetCodeController.clear();
    });
  }

  void _closeForm() {
    setState(() {
      _showForm = false;
      _selectedRequestType = null;
      _selectedPriority = 'medium';
      _titleController.clear();
      _descriptionController.clear();
      _assetCodeController.clear();
    });
  }

  Future<void> _submitForm() async {
    if (_selectedRequestType == null || _titleController.text.isEmpty || _descriptionController.text.isEmpty || _selectedPriority == null) {
      SnackbarHelper.showError(context, 'Please fill in all required fields');
      return;
    }
    if (_titleController.text.trim().length < 1) {
      SnackbarHelper.showError(context, 'Title must be at least 1 character.');
      return;
    }
    if (_descriptionController.text.trim().length < 10) {
      SnackbarHelper.showError(context, 'Details must be at least 10 characters.');
      return;
    }
    setState(() => _isSubmitting = true);
    final result = await _itRequestService.createRequest(
      requestType: _selectedRequestType!,
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      priority: _selectedPriority!,
      relatedAssetCode: _assetCodeController.text.trim(),
    );
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    if (result['success'] == true) {
      SnackbarHelper.showSuccess(context, 'IT request created successfully!');
      _closeForm();
      _loadRequests();
    } else {
      SnackbarHelper.showError(context, result['message'] ?? 'Failed to create request');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgGray,
      appBar: AppBar(
        backgroundColor: bgGray,
        elevation: 0,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 10,
              ),
            ],
          ),
          child: IconButton(
            icon: const Icon(Icons.chevron_left, color: navyColor),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        title: const Text(
          'IT Support',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
            color: navyColor,
          ),
        ),
        centerTitle: false,
        actions: [
          Container(
            margin: const EdgeInsets.all(8),
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: Text(
                'A',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: navyColor,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Raise Request Hero
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 30,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: const Color(0xFFFAF5FF),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Icon(
                                Icons.headset,
                                color: Color(0xFFA855F7),
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Need Assistance?',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: navyColor,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Describe your issue to our tech team.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.grey[400],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _openRequestForm,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: navyColor,
                              foregroundColor: yellowAccent,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              elevation: 8,
                              shadowColor: navyColor.withValues(alpha: 0.3),
                            ),
                            child: const Text(
                              'Raise IT Request',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Removed second button as requested
                        const SizedBox(height: 24),
                        Container(
                          width: 56,
                          height: 6,
                          decoration: BoxDecoration(
                            color: yellowAccent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // Loading State
                if (_isLoading)
                  const Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(
                      child: CircularProgressIndicator(color: navyColor),
                    ),
                  ),

                // Active Requests
                if (!_isLoading)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(left: 4),
                        child: Text(
                          'MY ACTIVE REQUESTS',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.grey[400],
                            letterSpacing: 1.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (_activeRequests.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Center(
                            child: Text(
                              'No active requests',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey[400],
                              ),
                            ),
                          ),
                        ),
                      ..._activeRequests.map((request) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(28),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 30,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      request['title'],
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        color: navyColor,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: request['statusBg'],
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      request['status'],
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        color: request['statusColor'],
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${request['ticketId']} • ${request['date']}',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.grey[400],
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                request['description'],
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.grey[600],
                                  height: 1.5,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),

                const SizedBox(height: 28),

                // History Section
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(left: 4),
                        child: Text(
                          'REQUEST HISTORY',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.grey[400],
                            letterSpacing: 1.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Opacity(
                        opacity: 0.6,
                        child: Column(
                          children: _history
                              .map((item) {
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(28),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black
                                            .withValues(alpha: 0.04),
                                        blurRadius: 30,
                                        offset: const Offset(0, 10),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: Colors.grey[100],
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        child: Icon(
                                          item['icon'],
                                          size: 18,
                                          color: Colors.grey[400],
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              item['title'],
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.grey[600],
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              '${item['status']} • ${item['date']}',
                                              style: TextStyle(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w700,
                                                color: Colors.grey[400],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      if (item['resolved'])
                                        const Icon(
                                          Icons.check_circle,
                                          color: Color(0xFF16A34A),
                                          size: 18,
                                        ),
                                    ],
                                  ),
                                );
                              })
                              .toList(),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Animated overlay
          IgnorePointer(
            ignoring: !_showForm,
            child: AnimatedOpacity(
              opacity: _showForm ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 300),
              child: GestureDetector(
                onTap: _closeForm,
                child: Container(
                  width: double.infinity,
                  height: double.infinity,
                  color: Colors.black.withValues(alpha: 0.4),
                ),
              ),
            ),
          ),
          // Animated Bottom Sheet Form
          AnimatedPositioned(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOutCubic,
            bottom: _showForm ? 0 : -1000,
            left: 0,
            right: 0,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(32),
                  topRight: Radius.circular(32),
                ),
              ),
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(10),
                          ),
                          margin: const EdgeInsets.only(bottom: 24),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Create IT Request',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: navyColor,
                              ),
                            ),
                            GestureDetector(
                              onTap: _closeForm,
                              child: const Icon(
                                Icons.close,
                                color: Colors.grey,
                                size: 24,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 28),
                        // Request Type Dropdown (always first)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'REQUEST TYPE',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: textMuted,
                                letterSpacing: 1.0,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                border: Border.all(
                                  color: const Color(0xFFE2E8F0),
                                ),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: DropdownButton<String>(
                                value: _selectedRequestType,
                                hint: const Text('Select request type'),
                                isExpanded: true,
                                underline: const SizedBox(),
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: navyColor,
                                ),
                                items: [
                                  {'value': 'new', 'label': 'New'},
                                  {'value': 'new_asset', 'label': 'New Asset'},
                                  {'value': 'repair', 'label': 'Repair'},
                                  {'value': 'replacement', 'label': 'Replacement'},
                                  {'value': 'software_install', 'label': 'Software Install'},
                                  {'value': 'access_request', 'label': 'Access Request'},
                                  {'value': 'network_issue', 'label': 'Network Issue'},
                                  {'value': 'other', 'label': 'Other'},
                                ].map<DropdownMenuItem<String>>((type) {
                                  return DropdownMenuItem<String>(
                                    value: type['value'],
                                    child: Text(type['label']!),
                                  );
                                }).toList(),
                                onChanged: (value) {
                                  setState(() {
                                    _selectedRequestType = value;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        if (_selectedRequestType != null) ...[
                          // Title/Short Description
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'SHORT DESCRIPTION',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: textMuted,
                                  letterSpacing: 1.0,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _titleController,
                                decoration: InputDecoration(
                                  hintText: 'e.g. Need new laptop',
                                  hintStyle: TextStyle(
                                    color: Colors.grey[400],
                                    fontSize: 14,
                                  ),
                                  filled: true,
                                  fillColor: const Color(0xFFF1F5F9),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(
                                      color: Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(
                                      color: Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(
                                      color: navyColor,
                                    ),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          // Description/Details
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'DETAILS',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: textMuted,
                                  letterSpacing: 1.0,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _descriptionController,
                                maxLines: 5,
                                decoration: InputDecoration(
                                  hintText: 'Provide more details...',
                                  hintStyle: TextStyle(
                                    color: Colors.grey[400],
                                    fontSize: 14,
                                  ),
                                  filled: true,
                                  fillColor: const Color(0xFFF1F5F9),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(
                                      color: Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(
                                      color: Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(
                                      color: navyColor,
                                    ),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          // Priority Dropdown
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'PRIORITY',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: textMuted,
                                  letterSpacing: 1.0,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  border: Border.all(
                                    color: const Color(0xFFE2E8F0),
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: DropdownButton<String>(
                                  value: _selectedPriority,
                                  isExpanded: true,
                                  underline: const SizedBox(),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: navyColor,
                                  ),
                                  items: [
                                    {'value': 'low', 'label': 'Low'},
                                    {'value': 'medium', 'label': 'Medium'},
                                    {'value': 'high', 'label': 'High'},
                                    {'value': 'critical', 'label': 'Critical'},
                                  ].map<DropdownMenuItem<String>>((priority) {
                                    return DropdownMenuItem<String>(
                                      value: priority['value'],
                                      child: Text(priority['label']!),
                                    );
                                  }).toList(),
                                  onChanged: (value) {
                                    setState(() {
                                      _selectedPriority = value;
                                    });
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          // Asset Code (only for certain types)
                          if (_selectedRequestType == 'repair' || _selectedRequestType == 'replacement' || _selectedRequestType == 'new_asset')
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'RELATED ASSET CODE (optional)',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: textMuted,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _assetCodeController,
                                  decoration: InputDecoration(
                                    hintText: 'e.g. LAP-001',
                                    hintStyle: TextStyle(
                                      color: Colors.grey[400],
                                      fontSize: 14,
                                    ),
                                    filled: true,
                                    fillColor: const Color(0xFFF1F5F9),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: const BorderSide(
                                        color: Color(0xFFE2E8F0),
                                      ),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: const BorderSide(
                                        color: Color(0xFFE2E8F0),
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: const BorderSide(
                                        color: navyColor,
                                      ),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 14,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          const SizedBox(height: 24),
                          SizedBox(
                            width: double.infinity,
                            height: 56,
                            child: ElevatedButton(
                              onPressed: _isSubmitting ? null : _submitForm,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: navyColor,
                                foregroundColor: yellowAccent,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                elevation: 8,
                                shadowColor: navyColor.withValues(alpha: 0.3),
                              ),
                              child: _isSubmitting
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        color: yellowAccent,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text(
                                      'Submit Request',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ], // <-- Add this closing bracket for Column's children
                    ), // End of Column for form fields
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
