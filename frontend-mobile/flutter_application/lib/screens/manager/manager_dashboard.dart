import 'package:flutter/material.dart';
import 'dart:async';
import '../../services/attendance_service.dart';
import '../../services/holiday_service.dart';
import 'package:intl/intl.dart';
import '../manager_profile_screen.dart';
import '../cafeteria_screen.dart';
import '../parking_screen.dart';
import '../leave_screen.dart';
import '../../main.dart'; // Import main.dart for themeNotifier

class ManagerDashboard extends StatefulWidget {
  final Map<String, dynamic> userProfile;

  const ManagerDashboard({super.key, required this.userProfile});

  @override
  State<ManagerDashboard> createState() => _ManagerDashboardState();
}

class _ManagerDashboardState extends State<ManagerDashboard> {
  int _selectedIndex = 0;
  final ScrollController _scrollController = ScrollController();
  final AttendanceService _attendanceService = AttendanceService();
  final HolidayService _holidayService = HolidayService();

  // Holiday state
  List<Map<String, dynamic>> _holidays = [];
  bool _isLoadingHolidays = true;

  // Attendance tracking state
  bool _isCheckedIn = false;
  bool _isSubmitted = false;
  bool _isSubmitting = false; // Add state to track submission progress
  DateTime? _firstCheckInTime; // Changed from _currentCheckInTime to track first check-in
  DateTime? _lastCheckOutTime; // Track last check-out for submitted duration
  Duration _totalTrackedDuration = Duration.zero;
  Timer? _timer;
  String? _attendanceStatus; // To store backend status like DRAFT, SUBMITTED

  @override
  void initState() {
    super.initState();
    _fetchAttendanceStatus();
    _startTimer(); // Always run timer to update duration display if checked in
    _fetchHolidays();
  }

  @override
  void dispose() {
    _scrollController.dispose();
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
        // Handle potential null or different types for total_hours
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
             // Find the entry where check_out is null
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

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted && _isCheckedIn) {
        setState(() {}); // Trigger rebuild to update duration text
      }
    });
  }

  DateTime? _currentSessionStartTime;

  // Design constants matching employee dashboard
  static const Color navyColor = Color(0xFF1A367C);
  static const Color yellowAccent = Color(0xFFFDBB2D);
  
  String get managerName => widget.userProfile['full_name'] ?? 'Manager';

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

  Future<void> _handleCheckIn() async {
    if (_isSubmitted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Attendance already submitted for today!'), backgroundColor: Colors.orange),
      );
      return;
    }
    if (_isCheckedIn) return;
    
    // Optimistic update
    setState(() => _isCheckedIn = true);

    final result = await _attendanceService.checkIn();
    
    if (result['success']) {
      await _fetchAttendanceStatus(); // Refresh to get exact server times
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Checked in successfully!'), backgroundColor: Colors.green),
        );
      }
    } else {
      setState(() => _isCheckedIn = false); // Revert
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message']), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _handleCheckOut() async {
    if (_isSubmitted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Attendance already submitted for today!'), backgroundColor: Colors.orange),
      );
      return;
    }
    if (!_isCheckedIn) return;
    
    // Optimistic update
    setState(() => _isCheckedIn = false);

    final result = await _attendanceService.checkOut();
    
    if (result['success']) {
      await _fetchAttendanceStatus();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Checked out successfully!'), backgroundColor: Colors.green),
        );
      }
    } else {
       setState(() => _isCheckedIn = true); // Revert
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message']), backgroundColor: Colors.red),
        );
      }
    }
  }


  Future<void> _handleSubmit() async {
    // Check if currently checked in
    if (_isCheckedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please check out before submitting!'), backgroundColor: Colors.orange),
      );
      return;
    }

    // Show confirmation dialog
    final bool? confirm = await showDialog<bool>(
      context: context,
      barrierDismissible: !_isSubmitting, // Prevent dismissing while submitting
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
      // Call submit API
      final result = await _attendanceService.submitAttendance();

      if (result['success']) {
        await _fetchAttendanceStatus();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Attendance submitted successfully!'), backgroundColor: Colors.green),
          );
        }
      } else {
         if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message']), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String _formatDuration() {
    if (_isSubmitted) {
      // Logic for submitted state: First Check-in to Last Check-out
      if (_firstCheckInTime != null && _lastCheckOutTime != null) {
        final duration = _lastCheckOutTime!.difference(_firstCheckInTime!);
        final hours = duration.inHours;
        final minutes = duration.inMinutes % 60;
         return '${hours.toString().padLeft(2, '0')}h ${minutes.toString().padLeft(2, '0')}m';
      } else {
         // Fallback if times are missing but submitted
         return _formatDurationFromDuration(_totalTrackedDuration);
      }
    }
  
    // Logic for active tracking
    Duration displayDuration = _totalTrackedDuration;
    
    if (_isCheckedIn && _currentSessionStartTime != null) {
      displayDuration += DateTime.now().difference(_currentSessionStartTime!);
    }
    
    return _formatDurationFromDuration(displayDuration);
  }
  
  String _formatDurationFromDuration(Duration duration) {
    if (duration == Duration.zero) {
      return '--h --m';
    }
    
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    return '${hours.toString().padLeft(2, '0')}h ${minutes.toString().padLeft(2, '0')}m';
  }

  String _getStatusText() {
    if (_isSubmitted) return 'Submitted';
    if (_isCheckedIn) return 'Tracking...';
    if (_totalTrackedDuration > Duration.zero) return 'Paused';
    return 'Not marked yet';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Stack(
          children: [
            IndexedStack(
              index: _selectedIndex,
              children: [
                _buildDashboardContent(),
                const LeaveScreen(),
                ManagerProfileScreen(
                  userProfile: widget.userProfile,
                  onBack: () {
                    setState(() {
                      _selectedIndex = 0;
                    });
                  },
                ),
              ],
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: Container(
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
                    _buildNavItem(0, Icons.show_chart, 'Dashboard'),
                    _buildNavItem(1, Icons.calendar_today, 'Leave'),
                    _buildNavItem(2, Icons.person, 'Profile'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    bool isSelected = _selectedIndex == index;
    return _HoverableNavItem(
      icon: icon,
      label: label,
      isSelected: isSelected,
      onTap: () {
        setState(() {
          _selectedIndex = index;
        });
      },
    );
  }

  Widget _buildDashboardContent() {
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
            _buildHeader(),
            const SizedBox(height: 24),
            _buildAttendanceCard(),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: _buildQuickLinkCard(
                  icon: Icons.restaurant,
                  title: 'Cafeteria',
                  subtitle: 'Manage reservations',
                  color: Colors.orange.shade100,
                  iconColor: Colors.orange,
                )),
                const SizedBox(width: 16),
                Expanded(child: _buildQuickLinkCard(
                  icon: Icons.local_parking,
                  title: 'Parking',
                  subtitle: 'View parking slots',
                  color: Colors.blue.shade100,
                  iconColor: Colors.blue,
                )),
              ],
            ),
            const SizedBox(height: 24),
            _buildTeamOverview(),
            const SizedBox(height: 24),
            _buildAnnouncedHolidays(),
            const SizedBox(height: 120), // Increased space for bottom nav
          ],
        ),
      ),
    );
  }

  String _getInitials(String name) {
    if (name.isEmpty) return 'M';
    
    // Split by non-alphanumeric characters (like dot, space, underscore)
    List<String> parts = name.split(RegExp(r'[^a-zA-Z0-9]'));
    parts = parts.where((p) => p.isNotEmpty).toList();

    if (parts.isEmpty) return name[0].toUpperCase();

    if (parts.length == 1) {
      if (parts[0].length > 1) {
         return parts[0].substring(0, 2).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }

    // Take first letter of first two parts
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 24, 8, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'MANAGER PORTAL',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: Colors.grey[400],
                  letterSpacing: 2.0,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Good Morning, $managerName',
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
              IconButton(
                icon: Icon(
                  Theme.of(context).brightness == Brightness.dark
                      ? Icons.light_mode
                      : Icons.dark_mode,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.orange
                      : navyColor,
                ),
                onPressed: () {
                  themeNotifier.value = Theme.of(context).brightness == Brightness.dark
                      ? ThemeMode.light
                      : ThemeMode.dark;
                },
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedIndex = 2;
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
                          _getInitials(managerName),
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
    return Container(
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
                        height: 20,
                        width: 20,
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
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: Container(
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: yellowAccent,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickLinkCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required Color iconColor,
  }) {
    return _HoverableCard(
      icon: icon,
      title: title,
      subtitle: subtitle,
      color: color,
      iconColor: iconColor,
      onTap: () async {
        if (title == 'Cafeteria') {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const CafeteriaScreen(
                initialShowDeskBooking: false,
              ),
            ),
          );
          if (result == 'profile') {
            setState(() {
              _selectedIndex = 2; // Navigate to Profile tab
            });
          }
        } else if (title == 'Parking') {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const ParkingScreen(),
            ),
          );
          if (result == 'profile') {
            setState(() {
              _selectedIndex = 2; // Navigate to Profile tab
            });
          }
        }
      },
    );
  }

  Widget _buildTeamOverview() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
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
           Text(
            'Team Overview',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white
                  : const Color(0xFF333333),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem('18', 'PRESENT', Colors.blue),
              _buildStatItem('3', 'ON LEAVE', Colors.red),
              _buildStatItem('2', 'PENDING', Colors.orange),
            ],
          ),
        ],
      ),
    );
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
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
           Text(
            'ANNOUNCED HOLIDAYS',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white
                  : const Color(0xFF1A237E),
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
                          return _buildHolidayRow(formattedDate, holiday['name'] ?? '', dayName, category, status, statusColor);
                        }).toList(),
                      ),
                    ),
        ],
      ),
    );
  }

  DataRow _buildHolidayRow(String date, String name, String day, String category, String status, Color statusColor) {
    return DataRow(
      cells: [
        DataCell(Text(date, style: TextStyle(
            fontWeight: FontWeight.w500,
            color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black87
        ))),
        DataCell(Text(name, style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark ? Colors.blueAccent[100] : const Color(0xFF1A237E),
            fontWeight: FontWeight.w500
        ))),
        DataCell(Text(day, style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black87
        ))),
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
  }

  Widget _buildStatItem(String value, String label, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1A1A2E),
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: 24,
          height: 3,
          color: color,
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey[500],
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }
}

class _HoverableCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final Color iconColor;
  final VoidCallback onTap;

  const _HoverableCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.iconColor,
    required this.onTap,
  });

  @override
  State<_HoverableCard> createState() => _HoverableCardState();
}

class _HoverableCardState extends State<_HoverableCard> {
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
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: _isHovered ? 0.1 : 0.05),
                blurRadius: _isHovered ? 15 : 10,
                offset: _isHovered ? const Offset(0, 8) : const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: widget.color.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(widget.icon, color: widget.iconColor, size: 28),
              ),
              const SizedBox(height: 12),
              Text(
                widget.title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF333333),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                widget.subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
               const SizedBox(height: 8),
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                height: 3,
                width: _isHovered ? 40 : 0,
                decoration: BoxDecoration(
                  color: Colors.orange,
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
