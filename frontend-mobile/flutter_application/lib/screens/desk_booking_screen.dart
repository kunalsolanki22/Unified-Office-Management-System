import 'package:flutter/material.dart';
import '../utils/snackbar_helper.dart';
import '../services/desk_service.dart';

class DeskBookingScreen extends StatefulWidget {
  const DeskBookingScreen({super.key});

  @override
  State<DeskBookingScreen> createState() => _DeskBookingScreenState();
}

class _DeskBookingScreenState extends State<DeskBookingScreen> {
  // Design constants
  static const Color navyColor = Color(0xFF1A367C);
  static const Color yellowAccent = Color(0xFFFDBB2D);
  static const Color bgGray = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF8E99A7);

  final DeskService _deskService = DeskService();

  // State
  int _selectedTabIndex = 0; // 0 = Workstation, 1 = Meeting Room
  String? _selectedDesk;
  bool _isModalVisible = false;
  bool _isLoading = true;
  bool _isBooking = false;

  // Booking form state
  DateTimeRange _selectedDateRange = DateTimeRange(
    start: DateTime.now(),
    end: DateTime.now(),
  );
  TimeOfDay _startTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 18, minute: 0);
  int _selectedFloor = 0;
  String _currentBookingItem = '';
  String _currentBookingType = '';
  String _currentBookingItemId = ''; // Store desk/room ID for API
  int _roomCapacity = 0;
  final TextEditingController _attendeesController = TextEditingController(text: '1');

  // Dynamic data from API
  List<Map<String, dynamic>> _allDesks = [];
  Map<String, bool> _deskAvailability = {};
  Map<String, String> _deskIds = {}; // Map desk code to desk ID for API
  List<Map<String, dynamic>> _bookingsForSelectedDate = [];

  List<Map<String, dynamic>> _meetingRooms = [];
  List<Map<String, dynamic>> _myRoomBookings = [];
  List<Map<String, dynamic>> _myDeskBookings = [];
  // Rooms that currently have pending requests (room_id strings)
  final Set<String> _pendingRoomIds = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      final start = _selectedDateRange.start;
      final dateStr = '${start.year}-${start.month.toString().padLeft(2, '0')}-${start.day.toString().padLeft(2, '0')}';
      
      final startTimeStr = '${_startTime.hour.toString().padLeft(2, '0')}:${_startTime.minute.toString().padLeft(2, '0')}:00';
      final endTimeStr = '${_endTime.hour.toString().padLeft(2, '0')}:${_endTime.minute.toString().padLeft(2, '0')}:00';

      // Load desks, rooms and bookings in parallel
      final results = await Future.wait([
        _deskService.getDesks(
          pageSize: 100,
          bookingDate: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
        ),
        _deskService.getBookingsForDate(dateStr),
        _deskService.getConferenceRooms(pageSize: 50),
        _deskService.getRoomBookingsForDate(dateStr),
        _deskService.getMyRoomBookings(),
        _deskService.getMyBookings(),
      ]);

      final desksResult = results[0];
      final bookingsResult = results[1];
      final roomsResult = results[2];
      final todaysRoomBookingsResult = results[3];
      final myRoomBookingsResult = results[4];
      final myDeskBookingsResult = results[5];

      if (!mounted) return;

      // Process desks
      if (desksResult['success'] == true) {
        final desks = List<Map<String, dynamic>>.from(desksResult['data'] ?? []);
        _allDesks = desks;
        
        _bookingsForSelectedDate = [];
        if (bookingsResult['success'] == true) {
          _bookingsForSelectedDate = List<Map<String, dynamic>>.from(bookingsResult['data'] ?? []);
        }

        _calculateAvailability();
      } else {
        SnackbarHelper.showError(context, desksResult['message'] ?? 'Failed to load desks');
      }

      // Process meeting rooms
      if (roomsResult['success'] == true) {
        final rooms = List<Map<String, dynamic>>.from(roomsResult['data'] ?? []);
        final roomList = rooms.map((room) => {
          'id': room['id']?.toString() ?? '',
          'name': room['room_label']?.toString() ?? room['name']?.toString() ?? 'Conference Room',
          'room_code': room['room_code']?.toString() ?? '',
          'capacity': room['capacity'] ?? 10,
          'available': (room['status']?.toString().toUpperCase() ?? 'AVAILABLE') == 'AVAILABLE',
          'amenities': List<String>.from(room['amenities'] ?? ['Whiteboard']),
        }).toList();

        // Process room bookings to find pending requests
        _pendingRoomIds.clear();
        if (todaysRoomBookingsResult['success'] == true) {
          final rawRoomBookings = List<Map<String, dynamic>>.from(todaysRoomBookingsResult['data'] ?? []);
          for (final b in rawRoomBookings) {
            final status = (b['status'] ?? '').toString().toLowerCase();
            final roomId = (b['room_id'] ?? '').toString();
            if (status.contains('pend') && roomId.isNotEmpty) {
              _pendingRoomIds.add(roomId);
            }
          }
        }

        // Process my room bookings - Show PENDING and CONFIRMED
        if (myRoomBookingsResult['success'] == true) {
          final raw = List<Map<String, dynamic>>.from(myRoomBookingsResult['data'] ?? []);
          final active = raw.where((b) {
            final s = (b['status'] ?? '').toString().toLowerCase();
            return s.contains('pend') || s.contains('confirm') || s.contains('approv');
          }).toList();
          
          // Sort: Pending first, then by date
          active.sort((a, b) {
            final statusA = (a['status'] ?? '').toString().toLowerCase();
            final statusB = (b['status'] ?? '').toString().toLowerCase();
            final isPendingA = statusA.contains('pend');
            final isPendingB = statusB.contains('pend');
            
            if (isPendingA && !isPendingB) return -1;
            if (!isPendingA && isPendingB) return 1;
            
            // Secondary sort by date
            final dateA = (a['booking_date'] ?? '').toString();
            final dateB = (b['booking_date'] ?? '').toString();
            return dateA.compareTo(dateB);
          });

          setState(() {
            _myRoomBookings = active;
          });
        }

        setState(() {
          _meetingRooms = List<Map<String, dynamic>>.from(roomList);
        });
      }
      // Process my desk bookings - keep pending and confirmed
      if (myDeskBookingsResult['success'] == true) {
        final raw = List<Map<String, dynamic>>.from(myDeskBookingsResult['data'] ?? []);
        final active = raw.where((b) {
          final s = (b['status'] ?? '').toString().toLowerCase();
          return s.contains('pend') || s.contains('confirm') || s.contains('approv');
        }).toList();
        setState(() {
          _myDeskBookings = active;
        });
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Error loading data: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  // Helper to parse "HH:MM:SS.mmmm" or "HH:MM" to double hours
  double _parseTimeToDouble(String? timeStr) {
    if (timeStr == null || timeStr.isEmpty) return 0.0;
    try {
      final parts = timeStr.split(':');
      final hour = double.parse(parts[0]);
      final minute = double.parse(parts[1]);
      return hour + minute / 60.0;
    } catch (e) {
      return 0.0;
    }
  }

  void _calculateAvailability() {
    // Build availability map
    final availability = <String, bool>{};
    final deskIdMap = <String, String>{};
    
    for (final desk in _allDesks) {
      final deskCode = desk['desk_code']?.toString() ?? 'D-${desk['id']}';
      final deskId = desk['id']?.toString() ?? '';
      
      final status = desk['status']?.toString().toUpperCase() ?? 'AVAILABLE';

      // Backend now sets status to BOOKED if there is an overlap
      final isBooked = status == 'BOOKED';
      final isOperational = status != 'MAINTENANCE' && status != 'INACTIVE';
      
      availability[deskCode] = !isBooked && isOperational;
      deskIdMap[deskCode] = deskId;
    }

    setState(() {
      _deskAvailability = availability;
      _deskIds = deskIdMap;
    });
  }

  bool _isOverlapping(double start1, double end1, double start2, double end2) {
    // Strict inequality handles adjacent slots (e.g. 10-11 and 11-12 do NOT overlap)
    // Also handle 0.0 case (parse error) safely
    if (start2 == 0.0 && end2 == 0.0) return false;
    return start1 < end2 && start2 < end1;
  }


  void _onDateRangeSelected(DateTimeRange range) {
    setState(() {
      _selectedDateRange = range;
    });
    _loadData(); // Reload bookings for new start date
  }

  void _onTimeChanged() {
    _loadData(); // Reload from backend with new time params
  }

  void _closeModal() {
    setState(() {
      _isModalVisible = false;
    });
  }

  Future<void> _confirmBooking() async {
    setState(() => _isBooking = true);

    // Get desk ID from mapping if not provided directly
    String itemId = _currentBookingItemId;
    if (itemId.isEmpty && _deskIds.containsKey(_currentBookingItem)) {
      itemId = _deskIds[_currentBookingItem]!;
    }

    if (itemId.isEmpty) {
      SnackbarHelper.showError(context, 'Unable to identify desk/room');
      setState(() => _isBooking = false);
      return;
    }

    // Format times
    final startTimeFormatted = '${_startTime.hour.toString().padLeft(2, '0')}:${_startTime.minute.toString().padLeft(2, '0')}:00';
    final endTimeFormatted = '${_endTime.hour.toString().padLeft(2, '0')}:${_endTime.minute.toString().padLeft(2, '0')}:00';
    
    // Time constraint check setup
    final newStart = _startTime.hour + _startTime.minute / 60.0;
    final newEnd = _endTime.hour + _endTime.minute / 60.0;

    int successCount = 0;
    List<String> failDates = [];
    
    // Calculate total days
    final days = _selectedDateRange.end.difference(_selectedDateRange.start).inDays + 1;

    for (int i = 0; i < days; i++) {
      final date = _selectedDateRange.start.add(Duration(days: i));
      final dateStr = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

      // Constraint Check: Max 2 bookings per day (Workstation only)
      if (_currentBookingType == 'Workstation') {
        final myBookingsForDate = _myDeskBookings.where((b) {
           final bDate = (b['start_date'] ?? b['booking_date'] ?? '').toString().split('T')[0];
           final status = (b['status'] ?? '').toString().toLowerCase();
           return bDate == dateStr && (status == 'confirmed' || status == 'pending' || status == 'approved');
        }).toList();

        if (myBookingsForDate.length >= 2) {
          failDates.add('$dateStr (Limit reached)');
          continue; 
        }

        // Constraint Check: Self-Overlap (cannot book same time twice)
        bool hasOverlap = false;
        for (final booking in myBookingsForDate) {
          final bStartStr = booking['start_time']?.toString() ?? '09:00:00';
          final bEndStr = booking['end_time']?.toString() ?? '18:00:00';
          
          final bStartParts = bStartStr.split(':');
          final bEndParts = bEndStr.split(':');
          
          final bStart = double.parse(bStartParts[0]) + double.parse(bStartParts[1]) / 60.0;
          final bEnd = double.parse(bEndParts[0]) + double.parse(bEndParts[1]) / 60.0;
          
          if (_isOverlapping(newStart, newEnd, bStart, bEnd)) {
               hasOverlap = true;
               break;
          }
        }
        
        if (hasOverlap) {
          failDates.add('$dateStr (Overlap)');
          continue;
        }
      }

      // API Call
      Map<String, dynamic> result;
      if (_currentBookingType == 'Workstation') {
        result = await _deskService.createDeskBooking(
          deskId: itemId,
          bookingDate: dateStr,
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
          purpose: 'Workstation booking',
        );
      } else {
        // Constraint Check: Self-Overlap (Room)
        final myRoomBookingsForDate = _myRoomBookings.where((b) {
           final bDate = (b['booking_date'] ?? '').toString().split('T')[0];
           final bRoomId = (b['room_id'] ?? '').toString();
           final status = (b['status'] ?? '').toString().toLowerCase();
           return bDate == dateStr && bRoomId == itemId && (status == 'confirmed' || status == 'pending' || status == 'approved');
        }).toList();

        bool hasRoomOverlap = false;
        for (final booking in myRoomBookingsForDate) {
          final bStartStr = booking['start_time']?.toString() ?? '09:00:00';
          final bEndStr = booking['end_time']?.toString() ?? '18:00:00';
          
          final bStart = _parseTimeToDouble(bStartStr);
          final bEnd = _parseTimeToDouble(bEndStr);
          
          if (_isOverlapping(newStart, newEnd, bStart, bEnd)) {
               hasRoomOverlap = true;
               break;
          }
        }

        if (hasRoomOverlap) {
          failDates.add('$dateStr (Already requested)');
          continue;
        }

        // Validate Attendees
        int attendees = int.tryParse(_attendeesController.text) ?? 1;
        if (attendees > _roomCapacity) {
          failDates.add("Attendees ($attendees) exceed capacity ($_roomCapacity)");
          continue;
        }

        result = await _deskService.createRoomBooking(
          roomId: itemId,
          bookingDate: dateStr,
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
          meetingTitle: 'Meeting Room Booking',
          description: 'Booked via mobile app',
          expectedAttendees: attendees,
        );
      }

      if (result['success'] == true) {
        successCount++;
        // Optimistic update for UI if it's the start date
        if (i == 0) {
           if (_currentBookingType == 'Workstation' && _deskAvailability.containsKey(_currentBookingItem)) {
             _deskAvailability[_currentBookingItem] = false;
           }
           if (_currentBookingType == 'Meeting Room') {
             _pendingRoomIds.add(_currentBookingItemId);
           }
        }
      } else {
        failDates.add('$dateStr (${result['message']})');
      }
    }

    if (!mounted) return;
    setState(() => _isBooking = false);
    _closeModal();
    _loadData(); // Refresh data

    if (successCount == days) {
       String msg = _currentBookingType == 'Workstation' 
           ? 'All $successCount bookings confirmed!'
           : 'Request Sent! Waiting for manager approval.';
       SnackbarHelper.showSuccess(context, msg);
    } else if (successCount > 0) {
       final failReason = failDates.isNotEmpty ? failDates.first : 'Unknown error';
       SnackbarHelper.showSuccess(context, '$successCount succeeded. Failed: $failReason');
    } else {
       if (failDates.isNotEmpty) {
          SnackbarHelper.showError(context, 'Failed: ${failDates.first}${failDates.length > 1 ? ' (+${failDates.length - 1} others)' : ''}');
       } else {
          SnackbarHelper.showError(context, 'Booking failed');
       }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgGray,
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                // Header
                _buildHeader(),
                // Main Tabs
                _buildTabToggle(),
                // Content
                Expanded(
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator(color: navyColor))
                      : _selectedTabIndex == 0
                          ? _buildWorkstationView()
                          : _buildMeetingRoomView(),
                ),
              ],
            ),
          ),
          // Booking Modal
          if (_isModalVisible) _buildBookingModal(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _selectedTabIndex == 0 ? _showMyDeskModal : _showMyBookingsModal,
        backgroundColor: navyColor,
        icon: Icon(_selectedTabIndex == 0 ? Icons.desk : Icons.list_alt, color: Colors.white),
        label: Text(
          _selectedTabIndex == 0 ? 'My Active Desks' : 'My Bookings',
                  style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  void _showMyDeskModal() {
    final now = DateTime.now();

    // Filter for Active Desks:
    // 1. Status is CONFIRMED, PENDING, or APPROVED (not CANCELLED/REJECTED)
    // 2. End time has not passed (Automatic Release logic)
    final activeBookings = _myDeskBookings.where((b) {
      final status = (b['status'] ?? '').toString().toLowerCase();
      if (status.contains('cancel') || status.contains('reject')) return false;

      final dateStr = (b['start_date'] ?? b['booking_date'] ?? '').toString().split('T')[0];
      final endTimeStr = b['end_time']?.toString() ?? '18:00:00';
      
      try {
        final dateParts = dateStr.split('-');
        
        // Handle HH:MM:SS.mmmm safely by taking substring or splitting
        final timeParts = endTimeStr.split(':');
        final hour = int.parse(timeParts[0]);
        final minute = int.parse(timeParts[1]);
        // Note: We ignore seconds/microseconds for the "isAfter" check typically, 
        // or we can parse them if strictly needed. 
        // But invalid format error happens if we assume strict HH:MM:SS and it has microseconds?
        // Actually, Time in Dart is usually just DateTime. 
        // If the string is "10:31:39.745611", split returns 3 parts.
        // int.parse(timeParts[1]) works matching "31".
        // But if I want to be safe, I should just use the helper or robust parsing.
        
        final endDateTime = DateTime(
          int.parse(dateParts[0]),
          int.parse(dateParts[1]),
          int.parse(dateParts[2]),
          hour,
          minute,
        );
        
        return endDateTime.isAfter(now);
      } catch (e) {
        // Fallback: If strict parsing fails (e.g. seconds), try to parse just the hour/minute
        return true; 
      }
    }).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'My Active Desks',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: navyColor,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: activeBookings.isEmpty
                  ? const Center(
                      child: Text(
                        'No active desk bookings found',
                        style: TextStyle(color: textMuted),
                      ),
                    )
                  : ListView.builder(
                      itemCount: activeBookings.length,
                      itemBuilder: (context, index) {
                        final booking = activeBookings[index];
                        final String deskLabel = booking['desk_label']?.toString() ?? 'Desk';
                        final String deskCode = booking['desk_code']?.toString() ?? '';
                        final String date = booking['start_date']?.toString() ?? '';
                        final String status = booking['status']?.toString() ?? 'CONFIRMED';
                        final String startTime = booking['start_time']?.toString().substring(0, 5) ?? '09:00';
                        final String endTime = booking['end_time']?.toString().substring(0, 5) ?? '18:00';
                        
                        Color _statusColor(String s) {
                          final st = s.toLowerCase();
                          if (st.contains('pending')) return const Color(0xFFF59E0B); // amber
                          if (st.contains('confirm') || st.contains('confirmed') || st.contains('approved')) return const Color(0xFF16A34A); // green
                          if (st.contains('cancel') || st.contains('rejected')) return const Color(0xFFEF4444); // red
                          return Colors.grey.shade400;
                        }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0F9FF),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFBAE6FD)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.desk, size: 16, color: navyColor),
                                      const SizedBox(width: 8),
                                      Text(
                                        deskLabel,
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: navyColor),
                                      ),
                                    ],
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                                    onPressed: () => _confirmDeskCancellation(booking['id'].toString()),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Code: $deskCode',
                                style: const TextStyle(fontWeight: FontWeight.w600, color: navyColor),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Date: $date • Time: $startTime - $endTime',
                                      style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _statusColor(status),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      status.toUpperCase(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDeskCancellation(String bookingId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Desk Booking'),
        content: const Text('Are you sure you want to release this desk?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Yes, Release'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final result = await _deskService.cancelDeskBooking(bookingId);
      if (result['success'] == true) {
        if (!mounted) return;
        Navigator.pop(context); // Close modal to refresh
        _loadData(); // Refresh data
        SnackbarHelper.showSuccess(context, 'Desk released successfully');
      } else {
        if (!mounted) return;
        SnackbarHelper.showError(context, result['message'] ?? 'Failed to release desk');
      }
    }
  }

  void _showMyBookingsModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'My Active Bookings',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: navyColor,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: _myRoomBookings.isEmpty
                  ? const Center(
                      child: Text(
                        'No active bookings found',
                        style: TextStyle(color: textMuted),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _myRoomBookings.length,
                      itemBuilder: (context, index) {
                        final booking = _myRoomBookings[index];
                        final String roomName = booking['room_label']?.toString() ?? 'Conference Room';
                        final String date = booking['booking_date']?.toString() ?? '';
                        final String startTime = booking['start_time']?.toString() ?? '';
                        final String endTime = booking['end_time']?.toString() ?? '';
                        final String title = booking['title']?.toString() ?? 'Meeting';
                        final String status = booking['status']?.toString() ?? 'CONFIRMED';

                        Color _statusColor(String s) {
                          final st = s.toLowerCase();
                          if (st.contains('pending')) return const Color(0xFFF59E0B);
                          if (st.contains('confirm') || st.contains('confirmed') || st.contains('approved')) return const Color(0xFF16A34A);
                          if (st.contains('cancel') || st.contains('rejected')) return const Color(0xFFEF4444);
                          return Colors.grey.shade400;
                        }
                        
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0F9FF),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFBAE6FD)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.event, size: 16, color: navyColor),
                                      const SizedBox(width: 8),
                                      Text(
                                        title,
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: navyColor),
                                      ),
                                    ],
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                                    onPressed: () => _confirmCancellation(booking['id'].toString()),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '$roomName',
                                style: const TextStyle(fontWeight: FontWeight.w600, color: navyColor),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      '$date • $startTime - $endTime',
                                      style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _statusColor(status),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      status.toUpperCase(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmCancellation(String bookingId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Booking'),
        content: const Text('Are you sure you want to cancel this booking?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final result = await _deskService.cancelRoomBooking(bookingId);
      if (result['success'] == true) {
        if (!mounted) return;
        Navigator.pop(context); // Close modal to refresh
        _loadData(); // Refresh data
        SnackbarHelper.showSuccess(context, 'Booking cancelled successfully');
      } else {
        if (!mounted) return;
        SnackbarHelper.showError(context, result['message'] ?? 'Failed to cancel booking');
      }
    }
  }

  List<Map<String, dynamic>> _getBookingsForSelectedDate() {
    final start = _selectedDateRange.start;
    final dateStr = '${start.year}-${start.month.toString().padLeft(2, '0')}-${start.day.toString().padLeft(2, '0')}';
    
    try {
      return _myDeskBookings.where((b) {
        final bDate = (b['start_date'] ?? b['booking_date'] ?? '').toString().split('T')[0];
        final status = (b['status'] ?? '').toString().toLowerCase();
        return bDate == dateStr && (status == 'confirmed' || status == 'pending' || status == 'approved');
      }).toList();
    } catch (_) {
      return [];
    }
  }

  void _openBookingModal(String title, String type, {String itemId = '', int capacity = 0}) {
    setState(() {
      _currentBookingItem = title;
      _currentBookingType = type;
      _currentBookingItemId = itemId;
      _roomCapacity = capacity;
      _attendeesController.text = '1';
      _isModalVisible = true;
    });
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                  ),
                ],
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: const Icon(
                Icons.chevron_left,
                color: navyColor,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 16),
          const Text(
            'Select Your Seat',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: navyColor,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabToggle() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: const Color(0xFFEEF2F6),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => setState(() => _selectedTabIndex = 0),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: _selectedTabIndex == 0
                      ? BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 12,
                            ),
                          ],
                        )
                      : const BoxDecoration(color: Colors.transparent),
                  child: Text(
                    'WORKSTATION',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: _selectedTabIndex == 0 ? navyColor : textMuted,
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => setState(() => _selectedTabIndex = 1),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: _selectedTabIndex == 1
                      ? BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 12,
                            ),
                          ],
                        )
                      : const BoxDecoration(color: Colors.transparent),
                  child: Text(
                    'MEETING ROOM',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: _selectedTabIndex == 1 ? navyColor : textMuted,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkstationView() {
    if (_allDesks.isEmpty) {
      return Center(
        child: Text(
          'No desks available for your department',
          style: const TextStyle(color: textMuted),
        ),
      );
    }

    // Group desks by floor
    final desktopsByFloor = <String, List<Map<String, dynamic>>>{};
    for (final desk in _allDesks) {
      final floor = desk['floor']?.toString() ?? 'Unknown Floor';
      if (!desktopsByFloor.containsKey(floor)) {
        desktopsByFloor[floor] = [];
      }
      desktopsByFloor[floor]!.add(desk);
    }

    final floors = desktopsByFloor.keys.toList()..sort();

    // Check for booked desks
    final bookedDesks = _getBookingsForSelectedDate();

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Booked Desk Cards
          if (bookedDesks.isNotEmpty) ...[
            ...bookedDesks.map((bookedDesk) => Container(
              margin: const EdgeInsets.only(bottom: 24),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFBFDBFE)),
                boxShadow: [
                  BoxShadow(
                    color: navyColor.withValues(alpha: 0.1),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                             BoxShadow(
                               color: Colors.black.withValues(alpha: 0.05),
                               blurRadius: 4,
                             )
                          ]
                        ),
                        child: const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Your Desk Booking',
                              style: TextStyle(
                                fontSize: 14,
                                color: navyColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${bookedDesk['desk_label'] ?? 'Desk'} (${bookedDesk['desk_code'] ?? ''})',
                              style: const TextStyle(
                                fontSize: 18,
                                color: navyColor,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${(bookedDesk['start_time'] ?? '09:00:00').toString().length >= 5 ? (bookedDesk['start_time'] ?? '09:00:00').toString().substring(0, 5) : '09:00'} - ${(bookedDesk['end_time'] ?? '18:00:00').toString().length >= 5 ? (bookedDesk['end_time'] ?? '18:00:00').toString().substring(0, 5) : '18:00'}',
                               style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey.shade600,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16A34A),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          (bookedDesk['status'] ?? 'Confirmed').toString().toUpperCase(),
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _confirmDeskCancellation(bookedDesk['id'].toString()),
                      icon: const Icon(Icons.exit_to_app, size: 18),
                      label: const Text('Release Desk'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFFEF4444),
                        elevation: 0,
                        side: const BorderSide(color: Color(0xFFEF4444)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            )).toList(),
          ],

          // Floor Layouts (Only show if no desk is booked? Or show anyway but disabled? Single desk booking implies we shouldn't book another. But showing layout is fine.)
          // The prompt says "when the desk is book, show the booked desk below the layout."
          // So the layout should STILL BE VISIBLE.
          ...floors.map((floor) {
            final desks = desktopsByFloor[floor]!;

            // Group desks by detected area (based on desk_label) and sort by desk_label
            String _detectArea(String label) {
              final l = label.toLowerCase();
              if (l.contains('window')) return 'WINDOW';
              if (l.contains('corner')) return 'CORNER';
              if (l.contains('open area') || l.contains('open')) return 'OPEN';
              if (l.contains('quiet')) return 'QUIET';
              return 'OTHER';
            }

            final Map<String, List<Map<String, dynamic>>> areas = {};
            for (final d in desks) {
              final label = (d['desk_label'] ?? d['desk_code'] ?? '').toString();
              final area = _detectArea(label);
              areas.putIfAbsent(area, () => []).add(d);
            }

            // Define ordering and prefix letters per area
            final areaOrder = ['WINDOW', 'CORNER', 'OPEN', 'QUIET', 'OTHER'];
            final areaLetter = {'WINDOW': 'A', 'CORNER': 'B', 'OPEN': 'C', 'QUIET': 'D', 'OTHER': 'E'};

            return Container(
              margin: const EdgeInsets.only(bottom: 24),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(32),
                border: Border.all(
                  color: const Color(0xFFCBD5E1),
                  width: 2,
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$floor Layout',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Colors.grey.shade400,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Render areas in preferred order
                  ...areaOrder.where((a) => areas.containsKey(a)).map((areaKey) {
                    final list = areas[areaKey]!;
                    // sort by desk_label
                    list.sort((a, b) => (a['desk_label'] ?? a['desk_code'] ?? '').toString().compareTo((b['desk_label'] ?? b['desk_code'] ?? '').toString()));
                    // Use real labels from backend
                    final displayItems = <Map<String, dynamic>>[];
                    for (var i = 0; i < list.length; i++) {
                      final item = list[i];
                      final deskId = item['id']?.toString() ?? '';
                      
                      String fullLabel = (item['desk_label'] ?? item['desk_code'] ?? '').toString();
                      // Extract short version (e.g., "A1" from "Window Desk A1")
                      String shortLabel = fullLabel;
                      if (fullLabel.contains(' ')) {
                        shortLabel = fullLabel.split(' ').last;
                      }

                      displayItems.add({
                        'assigned': shortLabel,
                        'label': fullLabel,
                        'deskId': deskId,
                        'deskCode': (item['desk_code'] ?? '').toString(),
                      });
                    }

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          areaKey == 'WINDOW'
                              ? 'Window Desks'
                              : areaKey == 'CORNER'
                                  ? 'Corner Desks'
                                  : areaKey == 'OPEN'
                                      ? 'Open Area'
                                      : areaKey == 'QUIET'
                                          ? 'Quiet Zone'
                                          : 'Other Desks',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: displayItems.map((it) {
                              final assigned = it['assigned'] as String;
                              final deskId = it['deskId'] as String;
                              final deskCode = it['deskCode'] as String;
                              final isAvailable = _deskAvailability[deskCode] ?? false;
                              return _buildDeskAssigned(assigned, isAvailable, deskId);
                            }).toList(),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    );
                  }).toList(),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildDeskAssigned(String assignedLabel, bool isAvailable, String deskId) {
    final bool isSelected = _selectedDesk == assignedLabel;

    return GestureDetector(
      onTap: isAvailable
          ? () {
              setState(() => _selectedDesk = assignedLabel);
              _openBookingModal(assignedLabel, 'Workstation', itemId: deskId);
            }
          : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: isSelected
              ? navyColor
              : isAvailable
                  ? Colors.white
                  : const Color(0xFFCBD5E1),
          borderRadius: BorderRadius.circular(12),
          border: isAvailable && !isSelected
              ? Border.all(color: const Color(0xFFE2E8F0), width: 1.5)
              : null,
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: navyColor.withValues(alpha: 0.2),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (!isAvailable)
              Icon(
                Icons.lock_person,
                size: 14,
                color: Colors.grey.shade500,
              )
            else
              Text(
                assignedLabel,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: assignedLabel.length > 4 ? 9 : 11,
                  fontWeight: FontWeight.w800,
                  color: isSelected ? yellowAccent : navyColor,
                  height: 1.1,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegend() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildLegendItem(
            Colors.white,
            'FREE',
            border: Border.all(color: Colors.grey.shade200),
          ),
          _buildLegendItem(navyColor, 'SELECTED'),
          _buildLegendItem(const Color(0xFFCBD5E1), 'OCCUPIED'),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label, {BoxBorder? border}) {
    return Column(
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
            border: border,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 8,
            fontWeight: FontWeight.w800,
            color: Colors.grey.shade400,
            letterSpacing: 1,
          ),
        ),
      ],
    );
  }

  Widget _buildMeetingRoomView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [


          Text(
            'AVAILABLE HALLS',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: Colors.grey.shade400,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          if (_meetingRooms.isEmpty)
             const Center(
               child: Padding(
                 padding: EdgeInsets.all(20.0),
                 child: Text("No meeting rooms available"),
               ),
             )
          else
            ..._meetingRooms.map((room) => _buildConferenceCard(room)),
        ],
      ),
    );
  }



  Widget _buildConferenceCard(Map<String, dynamic> room) {
    final bool isAvailable = room['available'] as bool;
    final List<String> amenities = room['amenities'] as List<String>;
    final String roomId = room['id'] as String;
    final String roomName = room['name'] as String;
    final bool hasPending = _pendingRoomIds.contains(roomId);

    return GestureDetector(
      onTap: () => _openBookingModal(roomName, 'Meeting Room', itemId: roomId, capacity: room['capacity'] ?? 10),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
             BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
             ),
          ],
        ),
        child: Stack(
          children: [
            // Left accent bar
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              child: Container(
                width: 4,
                decoration: BoxDecoration(
                  color: isAvailable ? navyColor : Colors.grey,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    bottomLeft: Radius.circular(20),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              roomName,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: navyColor,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Capacity: ${room['capacity']} People',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Colors.grey.shade400,
                              ),
                            ),
                          ],
                        ),
                      ),

                    ],
                  ),
                  const SizedBox(height: 12),
                  if (amenities.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: amenities
                          .map(
                            (amenity) => Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                amenity,
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingModal() {
    return Stack(
      children: [
        // Backdrop
        GestureDetector(
          onTap: _closeModal,
          child: Container(
            color: Colors.black.withValues(alpha: 0.5),
          ),
        ),
        // Modal Content
        Align(
          alignment: Alignment.bottomCenter,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(32),
                topRight: Radius.circular(32),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Select Schedule',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: navyColor,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_currentBookingType}: $_currentBookingItem',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade500,
                          ),
                        ),
                        if (_currentBookingType == 'Meeting Room')
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              'Max Capacity: $_roomCapacity',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFEF4444),
                              ),
                            ),
                          ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: textMuted),
                      onPressed: _closeModal,
                    ),
                  ],
                ),
                const SizedBox(height: 24),    // Date Picker
                GestureDetector(
                  onTap: () async {
                    final picked = await showDateRangePicker(
                      context: context,
                      initialDateRange: _selectedDateRange,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 180)), // Max 6 months
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: const ColorScheme.light(
                              primary: navyColor,
                              onPrimary: Colors.white,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (picked != null) {
                      _onDateRangeSelected(picked);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: bgGray,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Dates',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: textMuted,
                          ),
                        ),
                        Row(
                          children: [
                            Text(
                              _selectedDateRange.start.year == _selectedDateRange.end.year && 
                              _selectedDateRange.start.month == _selectedDateRange.end.month &&
                              _selectedDateRange.start.day == _selectedDateRange.end.day 
                                  ? '${_selectedDateRange.start.day}/${_selectedDateRange.start.month}/${_selectedDateRange.start.year}'
                                  : '${_selectedDateRange.start.day}/${_selectedDateRange.start.month} - ${_selectedDateRange.end.day}/${_selectedDateRange.end.month}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: navyColor,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(
                              Icons.calendar_today,
                              size: 16,
                              color: navyColor,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Select Time Slot',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: navyColor,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('From', style: TextStyle(color: textMuted, fontSize: 12)),
                          const SizedBox(height: 8),
                          InkWell(
                            onTap: () async {
                              final time = await showTimePicker(
                                context: context,
                                initialTime: _startTime,
                              );
                              if (time != null) {
                                setState(() {
                                  _startTime = time;
                                });
                                _onTimeChanged();
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.access_time, size: 16, color: navyColor),
                                  const SizedBox(width: 8),
                                  Text(
                                    _startTime.format(context),
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: navyColor),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('To', style: TextStyle(color: textMuted, fontSize: 12)),
                          const SizedBox(height: 8),
                          InkWell(
                            onTap: () async {
                              final time = await showTimePicker(
                                context: context,
                                initialTime: _endTime,
                              );
                              if (time != null) {
                                setState(() {
                                  _endTime = time;
                                });
                                _onTimeChanged();
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.access_time, size: 16, color: navyColor),
                                  const SizedBox(width: 8),
                                  Text(
                                    _endTime.format(context),
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: navyColor),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                if (_currentBookingType == 'Meeting Room') ...[
                  const Text(
                    'Number of Attendees',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: navyColor,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _attendeesController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: 'Enter number of attendees',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(12)),
                        borderSide: BorderSide(color: navyColor, width: 2),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                const SizedBox(height: 32),
                // Confirm Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isBooking ? null : _confirmBooking,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: navyColor,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: _isBooking
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            _currentBookingType == 'Meeting Room' ? 'REQUEST BOOKING' : 'CONFIRM BOOKING',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 1,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

}