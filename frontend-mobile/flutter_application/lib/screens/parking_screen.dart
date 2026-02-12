import 'package:flutter/material.dart';

class ParkingScreen extends StatefulWidget {
  const ParkingScreen({super.key});

  @override
  State<ParkingScreen> createState() => _ParkingScreenState();
}

class _ParkingScreenState extends State<ParkingScreen> {
  bool _isLevel1 = true;
  final ScrollController _scrollController = ScrollController();

  // Parking state - map of slot ID to SlotType
  late Map<String, SlotType> _level1Slots;
  late Map<String, SlotType> _level2Slots;
  
  // User's currently assigned slot
  String? _userParkedSlotId;
  bool _userIsOnLevel1 = true;

  @override
  void initState() {
    super.initState();
    _initializeSlots();
  }

  void _initializeSlots() {
    // Level 1 slots
    _level1Slots = {
      'A-01': SlotType.busy,
      'A-02': SlotType.free,
      'A-03': SlotType.free,
      'A-04': SlotType.busy,
      'A-05': SlotType.free,
      'B-01': SlotType.free,
      'B-02': SlotType.busy,
      'B-03': SlotType.free,
      'B-04': SlotType.free,
      'B-05': SlotType.busy,
    };
    
    // Level 2 slots
    _level2Slots = {
      'C-01': SlotType.free,
      'C-02': SlotType.busy,
      'C-03': SlotType.free,
      'C-04': SlotType.free,
      'C-05': SlotType.busy,
      'D-01': SlotType.busy,
      'D-02': SlotType.free,
      'D-03': SlotType.free,
      'D-04': SlotType.busy,
      'D-05': SlotType.free,
    };
  }

  // Get current level slots
  Map<String, SlotType> get _currentSlots => _isLevel1 ? _level1Slots : _level2Slots;

  // Get available slots sorted alphabetically
  List<String> _getAvailableSlots() {
    final slots = _currentSlots.entries
        .where((e) => e.value == SlotType.free)
        .map((e) => e.key)
        .toList();
    slots.sort();
    return slots;
  }

  // Auto-assign parking slot
  void _tapToPark() {
    final availableSlots = _getAvailableSlots();
    if (availableSlots.isEmpty) {
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(
          const SnackBar(
            content: Text('No available parking slots on this level'),
            backgroundColor: Colors.orange,
            duration: Duration(milliseconds: 1500),
          ),
        );
      return;
    }

    // Assign first available slot alphabetically
    final assignedSlot = availableSlots.first;
    setState(() {
      _currentSlots[assignedSlot] = SlotType.yours;
      _userParkedSlotId = assignedSlot;
      _userIsOnLevel1 = _isLevel1;
    });

    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          content: Text('Parking slot $assignedSlot assigned to you!'),
          backgroundColor: const Color(0xFF1A237E),
          duration: const Duration(milliseconds: 1500),
        ),
      );
  }

  // Exit parking
  void _exitParking() {
    if (_userParkedSlotId == null) return;

    setState(() {
      // Free up the slot
      if (_userIsOnLevel1) {
        _level1Slots[_userParkedSlotId!] = SlotType.free;
      } else {
        _level2Slots[_userParkedSlotId!] = SlotType.free;
      }
      _userParkedSlotId = null;
    });

    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        const SnackBar(
          content: Text('You have exited the parking'),
          backgroundColor: Colors.green,
          duration: Duration(milliseconds: 1500),
        ),
      );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(context),
            Expanded(
              child: Scrollbar(
                controller: _scrollController,
                thumbVisibility: true,
                trackVisibility: true,
                interactive: true,
                thickness: 8.0,
                radius: const Radius.circular(8),
                child: SingleChildScrollView(
                  controller: _scrollController,
                  padding: const EdgeInsets.only(bottom: 20),
                  child: Column(
                    children: [
                      _buildLevelToggle(),
                      const SizedBox(height: 24),
                      _buildParkingGrid(),
                      const SizedBox(height: 16),
                      _buildLegend(),
                      const SizedBox(height: 24),
                      _buildParkButton(),
                      // Show assigned slot info if parked
                      if (_userParkedSlotId != null)
                        _buildAssignedSlotInfo(),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Build Tap to Park / EXIT button
  Widget _buildParkButton() {
    final bool isParked = _userParkedSlotId != null;
    final bool isOnCurrentLevel = _userIsOnLevel1 == _isLevel1;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: isParked
              ? (isOnCurrentLevel ? _exitParking : null)
              : _tapToPark,
          style: ElevatedButton.styleFrom(
            backgroundColor: isParked ? Colors.red : const Color(0xFF1A237E),
            foregroundColor: Colors.white,
            disabledBackgroundColor: Colors.grey[400],
            disabledForegroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 18),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 0,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isParked ? Icons.exit_to_app : Icons.local_parking,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                isParked 
                    ? (isOnCurrentLevel ? 'EXIT PARKING' : 'PARKED ON ${_userIsOnLevel1 ? "LEVEL 01" : "LEVEL 02"}')
                    : 'TAP TO PARK',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Show assigned slot info
  Widget _buildAssignedSlotInfo() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A237E),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.amber,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                _userParkedSlotId!,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: Colors.black,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'YOUR ASSIGNED SLOT',
                  style: TextStyle(
                    color: Colors.orange,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Slot $_userParkedSlotId on ${_userIsOnLevel1 ? "Level 01" : "Level 02"}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.directions,
            color: Colors.white,
            size: 32,
          ),
        ],
      ),
    );
  }

  // ... (AppBar, LevelToggle same)

  Widget _buildParkingGrid() {
    // Get slot IDs for left and right columns based on level
    List<String> leftSlots;
    List<String> rightSlots;
    
    if (_isLevel1) {
      leftSlots = ['A-01', 'A-02', 'A-03', 'A-04', 'A-05'];
      rightSlots = ['B-01', 'B-02', 'B-03', 'B-04', 'B-05'];
    } else {
      leftSlots = ['C-01', 'C-02', 'C-03', 'C-04', 'C-05'];
      rightSlots = ['D-01', 'D-02', 'D-03', 'D-04', 'D-05'];
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFCFD8DC), // Greyish road/background
        borderRadius: BorderRadius.circular(32),
      ),
      child: Stack(
        children: [
          // Road Markings (Dashed Line Center)
          Positioned.fill(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(
                  6,
                  (index) => Container(
                    width: 4,
                    height: 20,
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
              ),
            ),
          ),
           // Arrows
           Positioned(
            left: 0, right: 0, top: 20,
            child: Icon(Icons.arrow_upward, color: Colors.white.withValues(alpha: 0.5), size: 20),
           ),
            Positioned(
            left: 0, right: 0, bottom: 20,
            child: Icon(Icons.arrow_upward, color: Colors.white.withValues(alpha: 0.5), size: 20),
           ),
           Positioned(
            left: 0, right: 0, top: 180,
            child: Icon(Icons.arrow_upward, color: Colors.white.withValues(alpha: 0.5), size: 20),
           ),

          Row(
            children: [
              Expanded(
                child: Column(
                  children: leftSlots.map((slotId) {
                    final type = _currentSlots[slotId] ?? SlotType.free;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _buildSlot(type: type, label: slotId),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(width: 40), // Road width
              Expanded(
                child: Column(
                  children: rightSlots.map((slotId) {
                    final type = _currentSlots[slotId] ?? SlotType.free;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _buildSlot(type: type, label: slotId),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: IconButton(
              icon: const Icon(Icons.chevron_left, color: Colors.black),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          const SizedBox(width: 16),
          const Text(
            'Parking Slot',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A2E),
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () {
              Navigator.pop(context, 'profile');
            },
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(
                child: Text(
                  'A',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A237E),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLevelToggle() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() {
                _isLevel1 = true;
              }),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: _isLevel1
                    ? BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      )
                    : null,
                child: Center(
                  child: Text(
                    'LEVEL 01',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: _isLevel1 ? const Color(0xFF1A237E) : Colors.grey[400],
                    ),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() {
                _isLevel1 = false;
              }),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: !_isLevel1
                    ? BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      )
                    : null,
                child: Center(
                  child: Text(
                    'LEVEL 02',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: !_isLevel1 ? const Color(0xFF1A237E) : Colors.grey[400],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSlot({required SlotType type, required String label}) {
    Color bgColor;
    Widget? content;

    switch (type) {
      case SlotType.free:
        bgColor = Colors.white;
        content = Center(
          child: Text(
            label,
            style: const TextStyle(
              color: Color(0xFF1A237E),
              fontWeight: FontWeight.bold,
            ),
          ),
        );
        break;
      case SlotType.yours:
        bgColor = Colors.amber;
        content = Center(
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.bold,
            ),
          ),
        );
        break;
      case SlotType.busy:
        bgColor = const Color(0xFF90A4AE);
        content = const Center(
          child: Icon(Icons.directions_car, color: Colors.white54),
        );
        break;
    }

    return Container(
      height: 60,
      width: double.infinity,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: content,
    );
  }

  Widget _buildLegend() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildLegendItem('FREE', Colors.white, borderColor: Colors.grey),
        _buildLegendItem('YOURS', Colors.amber),
        _buildLegendItem('BUSY', const Color(0xFF90A4AE)),
        // Removed EV ONLY item
      ],
    );
  }

  Widget _buildLegendItem(String label, Color color, {Color? borderColor, IconData? icon}) {
    return Column(
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: borderColor != null ? Border.all(color: borderColor) : null,
          ),
          child: icon != null ? Icon(icon, size: 12, color: Colors.green) : null,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

enum SlotType { free, yours, busy }
