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
  String _selectedWing = 'Wing A';
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
  List<String> _wingOptions = ['Wing A', 'Wing B', 'Wing C'];
  Map<String, bool> _deskAvailability = {};
  Map<String, String> _deskIds = {}; // Map desk code to desk ID for API
  List<Map<String, dynamic>> _meetingRooms = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    // Load desks and meeting rooms in parallel
    final results = await Future.wait([
      _deskService.getDesks(pageSize: 200),
      _deskService.getTodaysBookings(),
      _deskService.getConferenceRooms(pageSize: 50),
    ]);

    final desksResult = results[0];
    final bookingsResult = results[1];
    final roomsResult = results[2];

    if (!mounted) return;

    // Process desks
    if (desksResult['success'] == true) {
      final desks = List<Map<String, dynamic>>.from(desksResult['data'] ?? []);
      final bookedDeskIds = <String>{};
      
      // Get booked desk IDs for today
      if (bookingsResult['success'] == true) {
        final bookings = List<Map<String, dynamic>>.from(bookingsResult['data'] ?? []);
        for (final booking in bookings) {
          final deskId = booking['desk_id']?.toString() ?? '';
          if (deskId.isNotEmpty) bookedDeskIds.add(deskId);
        }
      }

      // Build availability map and wing options
      final wings = <String>{};
      final availability = <String, bool>{};
      final deskIdMap = <String, String>{};
      
      for (final desk in desks) {
        final deskCode = desk['desk_code']?.toString() ?? 'D-${desk['id']}';
        final deskId = desk['id']?.toString() ?? '';
        final wing = desk['wing']?.toString() ?? 'Wing A';
        final floor = desk['floor']?.toString() ?? '1';
        
        wings.add('$wing (Floor $floor)');
        
        // Desk is available if not booked for today and status is AVAILABLE
        final isBooked = bookedDeskIds.contains(deskId);
        final status = desk['status']?.toString().toUpperCase() ?? 'AVAILABLE';
        availability[deskCode] = !isBooked && status == 'AVAILABLE';
        deskIdMap[deskCode] = deskId;
      }

      setState(() {
        _wingOptions = wings.toList()..sort();
        _deskAvailability = availability;
        _deskIds = deskIdMap;
        if (_wingOptions.isNotEmpty && !_wingOptions.contains(_selectedWing)) {
          _selectedWing = _wingOptions.first;
        }
      });
    }

    // Process meeting rooms
    if (roomsResult['success'] == true) {
      final rooms = List<Map<String, dynamic>>.from(roomsResult['data'] ?? []);
      final roomList = rooms.map((room) => {
        'id': room['id']?.toString() ?? '',
        'name': room['name']?.toString() ?? 'Conference Room',
        'capacity': room['capacity'] ?? 10,
        'available': (room['status']?.toString().toUpperCase() ?? 'AVAILABLE') == 'AVAILABLE',
        'amenities': List<String>.from(room['amenities'] ?? ['Whiteboard']),
      }).toList();

      setState(() {
        _meetingRooms = List<Map<String, dynamic>>.from(roomList);
      });
    }

    setState(() => _isLoading = false);
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

    // Get desk ID from mapping
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
      // Mark as occupied locally
      if (_currentBookingType == 'Workstation' && _deskAvailability.containsKey(_currentBookingItem)) {
        setState(() {
          _deskAvailability[_currentBookingItem] = false;
          _selectedDesk = null;
        });
      }

      SnackbarHelper.showSuccess(
        context,
        "$_currentBookingType '$_currentBookingItem' reserved successfully!",
      );
      _closeModal();
      _loadData(); // Refresh data
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
    );
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
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 40),
      child: Column(
        children: [
          // Wing Dropdown
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedWing,
                  isExpanded: true,
                  icon: const Icon(
                    Icons.keyboard_arrow_down,
                    color: navyColor,
                    size: 20,
                  ),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: navyColor,
                  ),
                  items: _wingOptions.map((wing) {
                    return DropdownMenuItem(value: wing, child: Text(wing));
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _selectedWing = value);
                    }
                  },
                ),
              ),
            ),
          ),
          // Floor Plan
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Container(
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
                children: [
                  // Top Section: Meeting Room + Plants
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildMeetingRoomBox('Meeting Room 01', 128, 80),
                      Column(
                        children: [
                          Icon(
                            Icons.spa,
                            color: Colors.green.withValues(alpha: 0.4),
                            size: 14,
                          ),
                          const SizedBox(height: 16),
                          Icon(
                            Icons.spa,
                            color: Colors.green.withValues(alpha: 0.4),
                            size: 14,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                  // Pod Cluster 1
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildDeskPod([
                        'A-101',
                        'A-102',
                        'A-103',
                        'A-104',
                      ]),
                      _buildDeskPod([
                        'A-105',
                        'A-106',
                        'A-107',
                        'A-108',
                      ]),
                    ],
                  ),
                  const SizedBox(height: 40),
                  // Hallway
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        height: 1,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: Colors.grey.shade300,
                            style: BorderStyle.solid,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 4,
                        ),
                        color: const Color(0xFFF1F5F9),
                        child: Text(
                          'HALLWAY',
                          style: TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.w800,
                            color: Colors.grey.shade400,
                            letterSpacing: 2,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                  // Pod Cluster 2 (Window Side)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildDeskPod(['W-201', 'W-202']),
                      _buildMeetingRoomBox('Chill Zone', 96, 96),
                      _buildDeskPod(['W-203', 'W-204']),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
          // Legend
          _buildLegend(),
        ],
      ),
    );
  }

  Widget _buildMeetingRoomBox(String label, double width, double height) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 8,
            fontWeight: FontWeight.w800,
            color: Colors.grey.shade400,
          ),
        ),
      ),
    );
  }

  Widget _buildDeskPod(List<String> deskIds) {
    final int rows = (deskIds.length / 2).ceil();
    return Column(
      children: List.generate(rows, (rowIndex) {
        final startIdx = rowIndex * 2;
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (startIdx < deskIds.length) _buildDesk(deskIds[startIdx]),
            if (startIdx < deskIds.length) const SizedBox(width: 8),
            if (startIdx + 1 < deskIds.length)
              _buildDesk(deskIds[startIdx + 1]),
          ],
        );
      }).expand((row) => [row, const SizedBox(height: 8)]).toList()
        ..removeLast(),
    );
  }

  Widget _buildDesk(String deskCode) {
    final bool isAvailable = _deskAvailability[deskCode] ?? false;
    final bool isSelected = _selectedDesk == deskCode;
    final String deskId = _deskIds[deskCode] ?? '';

    return GestureDetector(
      onTap: isAvailable
          ? () {
              setState(() => _selectedDesk = deskCode);
              _openBookingModal(deskCode, 'Workstation', itemId: deskId);
            }
          : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        width: isSelected ? 46 : 42,
        height: isSelected ? 46 : 42,
        decoration: BoxDecoration(
          color: isSelected
              ? navyColor
              : isAvailable
                  ? Colors.white
                  : const Color(0xFFCBD5E1),
          borderRadius: BorderRadius.circular(10),
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
        child: Center(
          child: isAvailable
              ? Text(
                  deskId.split('-').last,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: isSelected ? yellowAccent : navyColor,
                  ),
                )
              : Icon(
                  Icons.lock_person,
                  size: 10,
                  color: Colors.grey.shade400,
                ),
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
          ..._meetingRooms.map((room) => _buildConferenceCard(room)),
        ],
      ),
    );
  }

  Widget _buildConferenceCard(Map<String, dynamic> room) {
    final bool isAvailable = room['available'] as bool;
    final List<String> amenities = room['amenities'] as List<String>;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
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
              decoration: const BoxDecoration(
                color: navyColor,
                borderRadius: BorderRadius.only(
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
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          room['name'],
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
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 40,
                  child: ElevatedButton(
                    onPressed: isAvailable
                        ? () => _openBookingModal(room['name'], 'Meeting Room', itemId: room['id'] ?? '')
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          isAvailable ? bgGray : Colors.grey.shade100,
                      foregroundColor:
                          isAvailable ? navyColor : Colors.grey.shade400,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: isAvailable
                            ? BorderSide(color: Colors.grey.shade200)
                            : BorderSide.none,
                      ),
                    ),
                    child: Text(
                      isAvailable ? 'Book This Hall' : 'Unavailable',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingModal() {
    return GestureDetector(
      onTap: _closeModal,
      child: Container(
        color: Colors.black.withValues(alpha: 0.5),
        child: Center(
          child: GestureDetector(
            onTap: () {}, // Prevent close on modal tap
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 40,
                    offset: const Offset(0, 20),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Modal Header
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.calendar_month,
                          color: navyColor,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Reserve Workspace',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: navyColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Date Picker
                  _buildFormLabel('SELECT DATE'),
                  const SizedBox(height: 8),
                  _buildDatePicker(),
                  const SizedBox(height: 20),
                  // Duration
                  _buildFormLabel('BOOKING DURATION'),
                  const SizedBox(height: 8),
                  _buildDurationChips(),
                  const SizedBox(height: 20),
                  // Floor
                  _buildFormLabel('PREFERRED FLOOR'),
                  const SizedBox(height: 8),
                  _buildFloorChips(),
                  const SizedBox(height: 24),
                  // Confirm Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isBooking ? null : _confirmBooking,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: navyColor,
                        foregroundColor: Colors.white,
                        elevation: 8,
                        shadowColor: navyColor.withValues(alpha: 0.3),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: _isBooking
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'SELECT YOUR SEAT',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                SizedBox(width: 8),
                                Icon(Icons.arrow_forward, size: 18),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFormLabel(String label) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        color: Colors.grey.shade400,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildDatePicker() {
    return GestureDetector(
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: _selectedDate,
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
          builder: (context, child) {
            return Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.light(
                  primary: navyColor,
                  onPrimary: Colors.white,
                  surface: Colors.white,
                  onSurface: navyColor,
                ),
              ),
              child: child!,
            );
          },
        );
        if (date != null) {
          setState(() => _selectedDate = date);
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: bgGray,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: navyColor,
              ),
            ),
            Icon(
              Icons.calendar_today_outlined,
              color: navyColor,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDurationChips() {
    final durations = ['Full Day', 'Morning', 'Evening'];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: List.generate(durations.length, (index) {
        final isSelected = _selectedDuration == index;
        return GestureDetector(
          onTap: () => setState(() => _selectedDuration = index),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected ? navyColor : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? navyColor : const Color(0xFFE2E8F0),
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: navyColor.withValues(alpha: 0.15),
                        blurRadius: 12,
                      ),
                    ]
                  : null,
            ),
            child: Text(
              durations[index],
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : textMuted,
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildFloorChips() {
    final floors = ['Floor 4 (Main)', 'Floor 2 (Lounge)', 'Floor 5'];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: List.generate(floors.length, (index) {
        final isSelected = _selectedFloor == index;
        return GestureDetector(
          onTap: () => setState(() => _selectedFloor = index),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected ? navyColor : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? navyColor : const Color(0xFFE2E8F0),
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: navyColor.withValues(alpha: 0.15),
                        blurRadius: 12,
                      ),
                    ]
                  : null,
            ),
            child: Text(
              floors[index],
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : textMuted,
              ),
            ),
          ),
        );
      }),
    );
  }
}
