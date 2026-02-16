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
  DateTime _selectedDate = DateTime.now();
  int _selectedDuration = 0; // 0 = Full Day, 1 = Morning, 2 = Evening
  int _selectedFloor = 0;
  String _currentBookingItem = '';
  String _currentBookingType = '';
  String _currentBookingItemId = ''; // Store desk/room ID for API

  // Dynamic data from API
  List<Map<String, dynamic>> _allDesks = [];
  Map<String, bool> _deskAvailability = {};
  Map<String, String> _deskIds = {}; // Map desk code to desk ID for API

  List<Map<String, dynamic>> _meetingRooms = [];
  List<Map<String, dynamic>> _myRoomBookings = [];
  List<Map<String, dynamic>> _myDeskBookings = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      // Load desks and meeting rooms in parallel
      final results = await Future.wait([
        _deskService.getDesks(pageSize: 100),
        _deskService.getTodaysBookings(),
        _deskService.getConferenceRooms(pageSize: 50),
        _deskService.getMyRoomBookings(),
        _deskService.getMyBookings(),
      ]);

      final desksResult = results[0];
      final bookingsResult = results[1];
      final roomsResult = results[2];
      final myRoomBookingsResult = results[3];
      final myDeskBookingsResult = results[4];

      if (!mounted) return;

      // Process desks
      if (desksResult['success'] == true) {
        final desks = List<Map<String, dynamic>>.from(desksResult['data'] ?? []);
        _allDesks = desks;
        
        final bookedDeskIds = <String>{};
        
        // Get booked desk IDs for today
        if (bookingsResult['success'] == true) {
          final bookings = List<Map<String, dynamic>>.from(bookingsResult['data'] ?? []);
          for (final booking in bookings) {
            final deskId = booking['desk_id']?.toString() ?? '';
            if (deskId.isNotEmpty) bookedDeskIds.add(deskId);
          }
        }

        // Build availability map
        final availability = <String, bool>{};
        final deskIdMap = <String, String>{};
        
        for (final desk in desks) {
          final deskCode = desk['desk_code']?.toString() ?? 'D-${desk['id']}';
          final deskId = desk['id']?.toString() ?? '';
          
          // Desk is available if not booked for today and status is AVAILABLE
          final isBooked = bookedDeskIds.contains(deskId);
          final status = desk['status']?.toString().toUpperCase() ?? 'AVAILABLE';
          availability[deskCode] = !isBooked && status == 'AVAILABLE';
          deskIdMap[deskCode] = deskId;
        }

        setState(() {
          _deskAvailability = availability;
          _deskIds = deskIdMap;
        });
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
          'amenities': List<String>.from(room['amenities'] ?? ['Whiteboard']),
        }).toList();

        // Process my room bookings
        if (myRoomBookingsResult['success'] == true) {
          setState(() {
            _myRoomBookings = List<Map<String, dynamic>>.from(myRoomBookingsResult['data'] ?? []);
          });
        }

        setState(() {
          _meetingRooms = List<Map<String, dynamic>>.from(roomList);
        });
      }
      // Process my desk bookings
      if (myDeskBookingsResult['success'] == true) {
        setState(() {
          _myDeskBookings = List<Map<String, dynamic>>.from(myDeskBookingsResult['data'] ?? []);
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

  void _openBookingModal(String itemName, String itemType, {String itemId = ''}) {
    setState(() {
      _currentBookingItem = itemName;
      _currentBookingType = itemType;
      _currentBookingItemId = itemId;
      _isModalVisible = true;
    });
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

    // Format date
    final dateStr = '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';
    
    // Determine time based on duration selection
    String startTime, endTime;
    switch (_selectedDuration) {
      case 1: // Morning
        startTime = '09:00:00';
        endTime = '13:00:00';
        break;
      case 2: // Evening
        startTime = '14:00:00';
        endTime = '18:00:00';
        break;
      default: // Full Day
        startTime = '09:00:00';
        endTime = '18:00:00';
    }

    Map<String, dynamic> result;
    if (_currentBookingType == 'Workstation') {
      result = await _deskService.createDeskBooking(
        deskId: itemId,
        bookingDate: dateStr,
        startTime: startTime,
        endTime: endTime,
        purpose: 'Workstation booking',
      );
    } else {
      result = await _deskService.createRoomBooking(
        roomId: itemId,
        bookingDate: dateStr,
        startTime: startTime,
        endTime: endTime,
        meetingTitle: 'Meeting Room Booking',
        description: 'Booked via mobile app',
      );
    }

    if (!mounted) return;
    setState(() => _isBooking = false);

    if (result['success'] == true) {
      // Mark as occupied locally to give instant feedback
      if (_currentBookingType == 'Workstation' && _deskAvailability.containsKey(_currentBookingItem)) {
        setState(() {
          _deskAvailability[_currentBookingItem] = false;
          _selectedDesk = null;
        });
      }

      SnackbarHelper.showSuccess(
        context,
        "$_currentBookingType reserved successfully!",
      );
      _closeModal();
      _loadData(); // Refresh data to be sure
    } else {
      SnackbarHelper.showError(
        context,
        result['message'] ?? 'Failed to create booking',
      );
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
          _selectedTabIndex == 0 ? 'My Desk' : 'My Bookings',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  void _showMyDeskModal() {
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
                  'My Active Desk',
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
              child: _myDeskBookings.isEmpty
                  ? const Center(
                      child: Text(
                        'No active desk bookings found',
                        style: TextStyle(color: textMuted),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _myDeskBookings.length,
                      itemBuilder: (context, index) {
                        final booking = _myDeskBookings[index];
                        final String deskLabel = booking['desk_label']?.toString() ?? 'Desk';
                        final String deskCode = booking['desk_code']?.toString() ?? '';
                        final String date = booking['start_date']?.toString() ?? '';
                        final String status = booking['status']?.toString() ?? 'CONFIRMED';
                        
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
                                      'Date: $date',
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
                onTap: () => setState(() => _selectedTabIndex = 0),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: _selectedTabIndex == 0 ? Colors.white : null,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: _selectedTabIndex == 0
                        ? [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 12,
                            ),
                          ]
                        : null,
                  ),
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
                onTap: () => setState(() => _selectedTabIndex = 1),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: _selectedTabIndex == 1 ? Colors.white : null,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: _selectedTabIndex == 1
                        ? [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 12,
                            ),
                          ]
                        : null,
                  ),
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

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        children: floors.map((floor) {
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
                  final prefix = areaLetter[areaKey] ?? 'Z';
                  // assign labels A1, A2.. per area
                  final displayItems = <Map<String, dynamic>>[];
                  for (var i = 0; i < list.length; i++) {
                    final item = list[i];
                    final deskId = item['id']?.toString() ?? '';
                    final assigned = '$prefix${i + 1}';
                    displayItems.add({
                      'assigned': assigned,
                      'label': (item['desk_label'] ?? item['desk_code'] ?? '').toString(),
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
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: isSelected ? yellowAccent : navyColor,
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

    return GestureDetector(
      onTap: isAvailable 
          ? () => _openBookingModal(roomName, 'Meeting Room', itemId: roomId)
          : null,
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
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isAvailable
                              ? const Color(0xFFDCFCE7)
                              : const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isAvailable ? 'AVAILABLE' : 'BOOKED',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: isAvailable
                                ? const Color(0xFF16A34A)
                                : const Color(0xFFEF4444),
                          ),
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
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: textMuted),
                      onPressed: _closeModal,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Date Picker
                GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 30)),
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
                      setState(() => _selectedDate = picked);
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
                          'Date',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: textMuted,
                          ),
                        ),
                        Row(
                          children: [
                            Text(
                              '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
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
                // Duration Cards
                Row(
                  children: [
                    Expanded(child: _buildDurationCard(1, 'Morning', '9AM - 1PM')),
                    const SizedBox(width: 12),
                    Expanded(child: _buildDurationCard(2, 'Evening', '2PM - 6PM')),
                  ],
                ),
                const SizedBox(height: 12),
                _buildDurationCard(0, 'Full Day', '9AM - 6PM'),
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
                        : const Text(
                            'CONFIRM BOOKING',
                            style: TextStyle(
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

  Widget _buildDurationCard(int index, String title, String time) {
    final bool isSelected = _selectedDuration == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedDuration = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? navyColor : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: isSelected
              ? null
              : Border.all(color: Colors.grey.shade200),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: navyColor.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: isSelected ? Colors.white : navyColor,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              time,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: isSelected
                    ? Colors.white.withValues(alpha: 0.7)
                    : textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}