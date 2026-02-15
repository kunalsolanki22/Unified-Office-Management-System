import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';
import '../utils/snackbar_helper.dart';

class AttendanceCard extends StatefulWidget {
  const AttendanceCard({super.key});

  @override
  State<AttendanceCard> createState() => _AttendanceCardState();
}

class _AttendanceCardState extends State<AttendanceCard> {
  // Attendance tracking state
  bool _isCheckedIn = false;
  bool _isSubmitted = false;
  DateTime? _currentCheckInTime;
  Duration _totalTrackedDuration = Duration.zero;
  Timer? _timer;
  DateTime? _lastResetDate;

  @override
  void initState() {
    super.initState();
    _checkDayReset();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _checkDayReset() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    if (_lastResetDate == null || _lastResetDate!.isBefore(today)) {
      // Reset for new day
      setState(() {
        _isCheckedIn = false;
        _isSubmitted = false;
        _currentCheckInTime = null;
        _totalTrackedDuration = Duration.zero;
        _lastResetDate = today;
      });
      _timer?.cancel();
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {}); // Refresh to update duration display
    });
  }

  void _handleCheckIn() {
    if (_isSubmitted) {
      SnackbarHelper.showWarning(context, 'Attendance already submitted for today!');
      return;
    }
    
    if (_isCheckedIn) return; // Already checked in
    
    setState(() {
      _isCheckedIn = true;
      _currentCheckInTime = DateTime.now();
    });
    _startTimer();
    
    SnackbarHelper.showSuccess(context, 'Checked in successfully!');
  }

  void _handleCheckOut() {
    if (_isSubmitted) {
      SnackbarHelper.showWarning(context, 'Attendance already submitted for today!');
      return;
    }
    
    if (!_isCheckedIn) {
      SnackbarHelper.showWarning(context, 'Please check in first!');
      return;
    }
    
    // Calculate duration for this session and add to total
    if (_currentCheckInTime != null) {
      final sessionDuration = DateTime.now().difference(_currentCheckInTime!);
      setState(() {
        _totalTrackedDuration += sessionDuration;
        _isCheckedIn = false;
        _currentCheckInTime = null;
      });
    }
    _timer?.cancel();
    
    SnackbarHelper.showSuccess(context, 'Checked out successfully!');
  }

  void _handleSubmit() {
    if (_isSubmitted) {
      SnackbarHelper.showWarning(context, 'Attendance already submitted for today!');
      return;
    }
    
    // If still checked in, add current session to total
    if (_isCheckedIn && _currentCheckInTime != null) {
      final sessionDuration = DateTime.now().difference(_currentCheckInTime!);
      _totalTrackedDuration += sessionDuration;
    }
    
    _timer?.cancel();
    
    setState(() {
      _isSubmitted = true;
      _isCheckedIn = false;
      _currentCheckInTime = null;
    });
    
    SnackbarHelper.showSuccess(context, 'Attendance submitted successfully!');
  }

  String _formatDuration() {
    Duration displayDuration = _totalTrackedDuration;
    
    // Add current session if checked in
    if (_isCheckedIn && _currentCheckInTime != null) {
      displayDuration += DateTime.now().difference(_currentCheckInTime!);
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

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(24),
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
          // Header: Icon + Title + Status
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.grey.withOpacity(0.1)
                      : const Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.access_time,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.white
                      : const Color(0xFF1A237E),
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Today's Attendance",
                    style: GoogleFonts.roboto(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.white
                          : const Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getStatusText(),
                    style: GoogleFonts.roboto(
                      fontSize: 14,
                      color: _isCheckedIn 
                          ? const Color(0xFF4CAF50) 
                          : const Color(0xFF8C8D90),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Action Buttons: Check In & Check Out
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
                              ? const Color(0xFFE0E0E0).withOpacity(0.5)
                              : const Color(0xFFE0E0E0)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.login,
                          size: 20,
                          color: _isCheckedIn
                              ? const Color(0xFF4CAF50)
                              : (_isSubmitted 
                                  ? Colors.grey[400]
                                  : const Color(0xFF111827)),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Check In',
                          style: GoogleFonts.roboto(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: _isCheckedIn
                                ? const Color(0xFF4CAF50)
                                : (_isSubmitted 
                                    ? Colors.grey[400]
                                    : const Color(0xFF111827)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: GestureDetector(
                  onTap: _isSubmitted ? null : _handleCheckOut,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: (!_isCheckedIn && _totalTrackedDuration > Duration.zero)
                          ? const Color(0xFFE8F5E9)
                          : (_isSubmitted 
                              ? const Color(0xFFE0E0E0).withOpacity(0.5)
                              : const Color(0xFFE0E0E0)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.logout,
                          size: 20,
                          color: (!_isCheckedIn && _totalTrackedDuration > Duration.zero)
                              ? const Color(0xFF4CAF50)
                              : (_isSubmitted 
                                  ? Colors.grey[400]
                                  : const Color(0xFF111827)),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Check Out',
                          style: GoogleFonts.roboto(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: (!_isCheckedIn && _totalTrackedDuration > Duration.zero)
                                ? const Color(0xFF4CAF50)
                                : (_isSubmitted 
                                    ? Colors.grey[400]
                                    : const Color(0xFF111827)),
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

          // Bottom Row: Submit & Duration
          Row(
            children: [
              Expanded(
                flex: 3,
                child: ElevatedButton(
                  onPressed: _isSubmitted ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isSubmitted 
                        ? const Color(0xFF1A237E).withOpacity(0.5)
                        : const Color(0xFF1A237E),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: const Color(0xFF1A237E).withOpacity(0.5),
                    disabledForegroundColor: Colors.white70,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    _isSubmitted ? 'Submitted' : 'Submit',
                    style: GoogleFonts.roboto(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? Colors.grey.withOpacity(0.1)
                        : const Color(0xFFF8F9FA),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.grey.withOpacity(0.2)
                          : Colors.grey.shade200,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'DURATION',
                        style: GoogleFonts.roboto(
                          fontSize: 12,
                          color: const Color(0xFF8C8D90),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        _formatDuration(),
                        style: GoogleFonts.roboto(
                          fontSize: 14,
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.white
                              : const Color(0xFF1A237E),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Decoration line
          const SizedBox(height: 16),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFFFC107),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ],
      ),
    );
  }
}
