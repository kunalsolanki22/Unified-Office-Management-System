import 'package:flutter/material.dart';
import 'dart:async';
import '../../services/attendance_service.dart';
import '../../services/holiday_service.dart';
import '../../utils/snackbar_helper.dart';
import 'package:intl/intl.dart';
import 'employee_profile_screen.dart';
import '../cafeteria_screen.dart';
import '../parking_screen.dart';
import '../it_support_screen.dart';
import '../desk_booking_screen.dart';
import '../leave_screen.dart';
import '../directory/directory_screen.dart';


class EmployeeDashboard extends StatefulWidget {
  final String userName;
  final VoidCallback? onToggleTheme;
  final bool? isDark;

  const EmployeeDashboard({
    super.key,
    this.userName = 'Alex',
    this.onToggleTheme,
    this.isDark,
  });

  @override
  State<EmployeeDashboard> createState() => _EmployeeDashboardState();
}

class _EmployeeDashboardState extends State<EmployeeDashboard> {
    String get _firstInitial => (widget.userName.isNotEmpty) ? widget.userName.trim()[0].toUpperCase() : '?';
  int _selectedIndex = 0;
  final AttendanceService _attendanceService = AttendanceService();
  final HolidayService _holidayService = HolidayService();

  // Holiday state
  List<Map<String, dynamic>> _holidays = [];
  bool _isLoadingHolidays = true;

  // Attendance tracking state
  bool _isCheckedIn = false;
  bool _isSubmitted = false;
  bool _isSubmitting = false;
  DateTime? _firstCheckInTime;
  DateTime? _lastCheckOutTime;
  Duration _totalTrackedDuration = Duration.zero;
  Timer? _timer;
  String? _attendanceStatus;
  DateTime? _currentSessionStartTime;

  // Design constants matching HTML
  static const Color navyColor = Color(0xFF1A367C);
  static const Color yellowAccent = Color(0xFFFDBB2D);
  static const Color bgGray = Color(0xFFF8FAFC);

  @override
  void initState() {
    super.initState();
    _fetchAttendanceStatus();
    _startTimer();
    _fetchHolidays();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchAttendanceStatus() async {
    final result = await _attendanceService.getMyStatus();
    if (result['success']) {
      final data = result['data'];
      if (!mounted) return;
      
      setState(() {
        _isCheckedIn = data['is_checked_in'] ?? false;
        final totalHours = data['total_hours'];
        double hours = 0.0;
        if (totalHours is int) {
          hours = totalHours.toDouble();
        } else if (totalHours is double) {
          hours = totalHours;
        }
        _totalTrackedDuration = Duration(minutes: (hours * 60).round());
        
        _attendanceStatus = data['status'];
        _isSubmitted = _attendanceStatus == 'submitted' || 
                       _attendanceStatus == 'approved' || 
                       _attendanceStatus == 'pending_approval';
        
        if (data['first_check_in'] != null) {
          _firstCheckInTime = _tryParseDate(data['first_check_in']);
        }
        
        if (data['last_check_out'] != null) {
          _lastCheckOutTime = _tryParseDate(data['last_check_out']);
        }
        
        if (_isCheckedIn) {
           final entries = data['entries'] as List?;
           if (entries != null && entries.isNotEmpty) {
             final openEntry = entries.firstWhere(
               (e) => e['check_out'] == null, 
               orElse: () => null
             );
             
             if (openEntry != null && openEntry['check_in'] != null) {
               _currentSessionStartTime = _tryParseDate(openEntry['check_in']);
             }
           }
        } else {
          _currentSessionStartTime = null;
        }
      });
    }
  }

  DateTime? _tryParseDate(dynamic dateStr) {
    if (dateStr == null) return null;
    if (dateStr is! String) return null;
    try {
      return DateTime.parse(dateStr);
    } catch (e) {
      print('Error parsing date: $dateStr - $e');
      return null;
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted && _isCheckedIn) {
        setState(() {});
      }
    });
  }

  Future<void> _handleCheckIn() async {
    if (_isSubmitted) {
      SnackbarHelper.showWarning(context, 'Attendance already submitted for today!');
      return;
    }
    if (_isCheckedIn) return;
    
    setState(() => _isCheckedIn = true);

    final result = await _attendanceService.checkIn();
    
    if (result['success']) {
      await _fetchAttendanceStatus();
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Checked in successfully!');
      }
    } else {
      setState(() => _isCheckedIn = false);
      if (mounted) {
        SnackbarHelper.showError(context, result['message']);
      }
    }
  }

  Future<void> _handleCheckOut() async {
    if (_isSubmitted) {
      SnackbarHelper.showWarning(context, 'Attendance already submitted for today!');
      return;
    }
    if (!_isCheckedIn) return;
    
    setState(() => _isCheckedIn = false);

    final result = await _attendanceService.checkOut();
    
    if (result['success']) {
      await _fetchAttendanceStatus();
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Checked out successfully!');
      }
    } else {
       setState(() => _isCheckedIn = true);
      if (mounted) {
        SnackbarHelper.showError(context, result['message']);
      }
    }
  }

  Future<void> _handleSubmit() async {
    if (_isCheckedIn) {
      SnackbarHelper.showWarning(context, 'Please check out before submitting!');
      return;
    }

    final bool? confirm = await showDialog<bool>(
      context: context,
      barrierDismissible: !_isSubmitting,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text(
            'Confirm Submission',
            style: TextStyle(
              color: navyColor,
              fontWeight: FontWeight.bold,
            ),
          ),
          content: const Text(
            'Are you sure you want to submit your attendance for today?',
            style: TextStyle(fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(false),
              child: Text(
                'No',
                style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.w600),
              ),
            ),
            ElevatedButton(
              onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: navyColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Yes, Submit'),
            ),
          ],
        );
      },
    );

    if (confirm != true) return;

    setState(() => _isSubmitting = true);

    try {
      final result = await _attendanceService.submitAttendance();

      if (result['success']) {
        await _fetchAttendanceStatus();
        if (mounted) {
          SnackbarHelper.showSuccess(context, 'Attendance submitted successfully!');
        }
      } else {
        if (mounted) {
          SnackbarHelper.showError(context, result['message'] ?? 'Submission failed');
        }
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Error: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String _formatDuration() {
    Duration displayDuration = _totalTrackedDuration;
    
    if (_isCheckedIn && _currentSessionStartTime != null) {
      displayDuration += DateTime.now().difference(_currentSessionStartTime!);
    }
    
    if (_isSubmitted && displayDuration == Duration.zero && _firstCheckInTime != null && _lastCheckOutTime != null) {
      displayDuration = _lastCheckOutTime!.difference(_firstCheckInTime!);
    }
    
    if (!_isSubmitted && displayDuration == Duration.zero) {
      return '--h --m';
    }
    
    final hours = displayDuration.inHours;
    final minutes = displayDuration.inMinutes % 60;
    return '${hours.toString().padLeft(2, '0')}h ${minutes.toString().padLeft(2, '0')}m';
  }

  String _getStatusText() {
    if (_isSubmitted) return 'Submitted';
    if (_isCheckedIn) return 'Tracking...';
    if (_totalTrackedDuration > Duration.zero) return 'Paused';
    return 'Not marked yet';
  }

  Future<void> _fetchHolidays() async {
    final result = await _holidayService.getHolidays(upcomingOnly: false);
    if (result['success'] && mounted) {
      setState(() {
        _holidays = List<Map<String, dynamic>>.from(result['data'] ?? []);
        _isLoadingHolidays = false;
      });
    } else if (mounted) {
      setState(() => _isLoadingHolidays = false);
    }
  }

  String _getHolidayStatus(String dateStr) {
    try {
      final holidayDate = DateTime.parse(dateStr);
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final hDate = DateTime(holidayDate.year, holidayDate.month, holidayDate.day);
      
      if (hDate.isBefore(today)) return 'COMPLETED';
      if (hDate.isAtSameMomentAs(today)) return 'TODAY';
      final diff = hDate.difference(today).inDays;
      if (diff <= 7) return 'UPCOMING';
      return 'SCHEDULED';
    } catch (e) {
      return 'SCHEDULED';
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED': return Colors.green;
      case 'TODAY': return Colors.blue;
      case 'UPCOMING': return Colors.orange;
      default: return Colors.grey;
    }
  }

  Widget _buildAnnouncedHolidays() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'ANNOUNCED HOLIDAYS',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A237E),
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 16),
            _isLoadingHolidays
                ? const Center(child: CircularProgressIndicator())
                : _holidays.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Text(
                            'No holidays announced yet',
                            style: TextStyle(color: Colors.grey[500], fontSize: 14),
                          ),
                        ),
                      )
                    : SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          columnSpacing: 20,
                          horizontalMargin: 0,
                          columns: const [
                            DataColumn(label: Text('DATE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF8C8D90)))),
                            DataColumn(label: Text('EVENT NAME', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF8C8D90)))),
                            DataColumn(label: Text('DAY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF8C8D90)))),
                            DataColumn(label: Text('CATEGORY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF8C8D90)))),
                            DataColumn(label: Text('STATUS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF8C8D90)))),
                          ],
                          rows: _holidays.map((holiday) {
                            final dateStr = holiday['date'] ?? '';
                            DateTime? parsedDate;
                            try { parsedDate = DateTime.parse(dateStr); } catch (_) {}
                            final formattedDate = parsedDate != null ? DateFormat('MMM dd, yyyy').format(parsedDate) : dateStr;
                            final dayName = parsedDate != null ? DateFormat('EEEE').format(parsedDate) : '';
                            final category = (holiday['holiday_type'] ?? 'company').toString().toUpperCase();
                            final status = _getHolidayStatus(dateStr);
                            final statusColor = _getStatusColor(status);
                            return DataRow(
                              cells: [
                                DataCell(Text(formattedDate, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.black87))),
                                DataCell(Text(holiday['name'] ?? '', style: const TextStyle(color: Color(0xFF1A237E), fontWeight: FontWeight.w500))),
                                DataCell(Text(dayName, style: const TextStyle(color: Colors.black87))),
                                DataCell(
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.amber.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      category,
                                      style: const TextStyle(fontSize: 10, color: Colors.amber, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ),
                                DataCell(
                                  Text(
                                    status,
                                    style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
          ],
        ),
      ),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  // Directory screen
  Widget _buildDirectoryScreen() {
    return Scaffold(
      backgroundColor: bgGray,
      appBar: AppBar(
        backgroundColor: navyColor,
        foregroundColor: Colors.white,
        title: const Text(
          'Company Directory',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: const Color(0xFFEFF6FF),
              child: Text(
                _firstInitial,
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: navyColor,
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Directory',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: navyColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Find your team members',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgGray,
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: [
            _buildDashboardContent(),
            const LeaveScreen(),
            const DirectoryScreen(),
            EmployeeProfileScreen(
              onBack: () {
                setState(() {
                  _selectedIndex = 0;
                });
              },
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildFloatingBottomNav(),
    );
  }

  Widget _buildDashboardContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 24),
          _buildAttendanceCard(),
          const SizedBox(height: 28),
          _buildQuickServicesSection(),
          const SizedBox(height: 28),
          _buildAnnouncedHolidays(),
          const SizedBox(height: 28),
          // Removed My Activity section
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 40, 24, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'DASHBOARD',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: Colors.grey[400],
                  letterSpacing: 2.0,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${_getGreeting()}, ${widget.userName}',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  color: navyColor,
                ),
              ),
            ],
          ),
          Row(
            children: [
              // Theme toggle button
              IconButton(
                icon: Icon(
                  (widget.isDark ?? false) ? Icons.dark_mode : Icons.light_mode,
                  color: yellowAccent,
                ),
                tooltip: 'Toggle Theme',
                onPressed: widget.onToggleTheme,
              ),
              const SizedBox(width: 8),
              // Profile icon
              GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedIndex = 3;
                  });
                },
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        border: Border.all(color: const Color(0xFFDBEAFE), width: 1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Center(
                        child: Text(
                          _firstInitial,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: navyColor,
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      top: -4,
                      right: -4,
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          color: yellowAccent,
                          border: Border.all(color: Colors.white, width: 3),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        width: double.infinity,
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
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Icon(
                    Icons.access_time_rounded,
                    color: navyColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Today's Attendance",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _getStatusText(),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _isCheckedIn ? const Color(0xFF4CAF50) : Colors.grey[400],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Check In / Check Out buttons row
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: _isSubmitted ? null : _handleCheckIn,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: _isCheckedIn
                            ? const Color(0xFFE8F5E9)
                            : (_isSubmitted 
                                ? const Color(0xFFF5F5F5).withOpacity(0.5)
                                : const Color(0xFFF5F5F5)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.login_rounded,
                            color: _isCheckedIn
                                ? const Color(0xFF4CAF50)
                                : (_isSubmitted 
                                    ? Colors.grey[400]
                                    : Colors.grey[600]),
                            size: 24,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Check In',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: _isCheckedIn
                                  ? const Color(0xFF4CAF50)
                                  : (_isSubmitted 
                                      ? Colors.grey[400]
                                      : Colors.grey[700]),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: _isSubmitted ? null : _handleCheckOut,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: (!_isCheckedIn && _totalTrackedDuration > Duration.zero)
                            ? const Color(0xFFE8F5E9)
                            : (_isSubmitted 
                                ? const Color(0xFFF5F5F5).withOpacity(0.5)
                                : const Color(0xFFF5F5F5)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.logout_rounded,
                            color: (!_isCheckedIn && _totalTrackedDuration > Duration.zero)
                                ? const Color(0xFF4CAF50)
                                : (_isSubmitted 
                                    ? Colors.grey[400]
                                    : Colors.grey[600]),
                            size: 24,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Check Out',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: (!_isCheckedIn && _totalTrackedDuration > Duration.zero)
                                  ? const Color(0xFF4CAF50)
                                  : (_isSubmitted 
                                      ? Colors.grey[400]
                                      : Colors.grey[700]),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Submit button and Duration row
            Row(
              children: [
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: (_isSubmitted || _isSubmitting) ? null : _handleSubmit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isSubmitted 
                          ? navyColor.withOpacity(0.5)
                          : navyColor,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: navyColor.withOpacity(0.5),
                      disabledForegroundColor: Colors.white70,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      elevation: 0,
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Text(
                            _isSubmitted ? 'Submitted' : 'Submit',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'DURATION',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Colors.grey[500],
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          _formatDuration(),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: navyColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickServicesSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(
              'QUICK SERVICES',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: Colors.grey[400],
                letterSpacing: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 1.3,
            children: [
              _buildQuickServiceCard(
                icon: Icons.restaurant,
                iconColor: const Color(0xFFF97316),
                iconBgColor: const Color(0xFFFFF7ED),
                title: 'Cafeteria',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const CafeteriaScreen(),
                    ),
                  );
                },
              ),
              _buildQuickServiceCard(
                icon: Icons.build_outlined,
                iconColor: const Color(0xFFA855F7),
                iconBgColor: const Color(0xFFFAF5FF),
                title: 'IT Support',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const ITSupportScreen(),
                    ),
                  );
                },
              ),
              _buildQuickServiceCard(
                icon: Icons.local_parking,
                iconColor: const Color(0xFF6366F1),
                iconBgColor: const Color(0xFFEEF2FF),
                title: 'Parking',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const ParkingScreen(),
                    ),
                  );
                },
              ),
              _buildQuickServiceCard(
                icon: Icons.desktop_mac_outlined,
                iconColor: const Color(0xFFF43F5E),
                iconBgColor: const Color(0xFFFFF1F2),
                title: 'Desk Booking',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const DeskBookingScreen(),
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickServiceCard({
    required IconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required String title,
    required VoidCallback onTap,
  }) {
    return _HoverableServiceCard(
      icon: icon,
      iconColor: iconColor,
      iconBgColor: iconBgColor,
      title: title,
      onTap: onTap,
    );
  }

  Widget _buildActivityItem({
    required String title,
    required String subtitle,
    required String status,
    required Color statusColor,
    required Color statusBgColor,
    required Color accentColor,
  }) {
    return Container(
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
      child: Row(
        children: [
          Container(
            width: 6,
            height: 44,
            decoration: BoxDecoration(
              color: accentColor,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: Colors.grey[400],
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: statusBgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              status,
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w900,
                color: statusColor,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingBottomNav() {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 0, 24, 30),
      height: 90,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 40,
            offset: const Offset(0, 15),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildNavItem(
            icon: Icons.show_chart,
            label: 'Dashboard',
            isSelected: _selectedIndex == 0,
            onTap: () => setState(() => _selectedIndex = 0),
          ),
          _buildNavItem(
            icon: Icons.calendar_today,
            label: 'Leave',
            isSelected: _selectedIndex == 1,
            onTap: () => setState(() => _selectedIndex = 1),
          ),
          _buildNavItem(
            icon: Icons.contacts,
            label: 'Directory',
            isSelected: _selectedIndex == 2,
            onTap: () => setState(() => _selectedIndex = 2),
          ),
          _buildNavItem(
            icon: Icons.person,
            label: 'Profile',
            isSelected: _selectedIndex == 3,
            onTap: () => setState(() => _selectedIndex = 3),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return _HoverableNavItem(
      icon: icon,
      label: label,
      isSelected: isSelected,
      onTap: onTap,
    );
  }
}

/// Hoverable navigation item with scale animation
class _HoverableNavItem extends StatefulWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _HoverableNavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_HoverableNavItem> createState() => _HoverableNavItemState();
}

class _HoverableNavItemState extends State<_HoverableNavItem> {
  bool _isHovered = false;

  static const Color navyColor = Color(0xFF1A367C);
  static const Color textMuted = Color(0xFF8E99A7);

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          transform: _isHovered ? (Matrix4.identity()..scale(1.15)) : Matrix4.identity(),
          transformAlignment: Alignment.center,
          width: 70,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: widget.isSelected ? navyColor : Colors.transparent,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: widget.isSelected
                      ? [
                          BoxShadow(
                            color: navyColor.withValues(alpha: _isHovered ? 0.35 : 0.2),
                            blurRadius: _isHovered ? 20 : 15,
                            offset: const Offset(0, 8),
                          ),
                        ]
                      : null,
                ),
                child: Icon(
                  widget.icon,
                  color: widget.isSelected ? Colors.white : textMuted,
                  size: 18,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                widget.label.toUpperCase(),
                style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: widget.isSelected ? navyColor : textMuted,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Hoverable service card with scale animation on hover
class _HoverableServiceCard extends StatefulWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String title;
  final VoidCallback onTap;

  const _HoverableServiceCard({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.title,
    required this.onTap,
  });

  @override
  State<_HoverableServiceCard> createState() => _HoverableServiceCardState();
}

class _HoverableServiceCardState extends State<_HoverableServiceCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          transform: _isHovered ? (Matrix4.identity()..scale(1.05)) : Matrix4.identity(),
          transformAlignment: Alignment.center,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: _isHovered ? 0.1 : 0.04),
                blurRadius: _isHovered ? 40 : 30,
                offset: _isHovered ? const Offset(0, 15) : const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: widget.iconBgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  widget.icon,
                  color: widget.iconColor,
                  size: 22,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                widget.title.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: Color(0xFF111827),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                height: 3,
                width: _isHovered ? 40 : 0,
                decoration: BoxDecoration(
                  color: widget.iconColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
