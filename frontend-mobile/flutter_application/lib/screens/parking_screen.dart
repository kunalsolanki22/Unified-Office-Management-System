import 'package:flutter/material.dart';
import '../services/parking_service.dart';
import '../utils/snackbar_helper.dart';

class ParkingScreen extends StatefulWidget {
  const ParkingScreen({super.key});

  @override
  State<ParkingScreen> createState() => _ParkingScreenState();
}

class _ParkingScreenState extends State<ParkingScreen> {
  bool _isLevel1 = true; // Level 1 = Cars, Level 2 = Bikes
  final ScrollController _scrollController = ScrollController();
  final ParkingService _parkingService = ParkingService();
  bool _isLoading = true;
  bool _isParkingAction = false;

  // Parking state - map of slot_label to SlotType
  Map<String, SlotType> _carSlots = {};  // Level 1: Employee car slots
  Map<String, SlotType> _bikeSlots = {}; // Level 2: Employee bike slots
  
  // Map slot_label to slot_id for API calls
  final Map<String, String> _slotLabelToId = {};
  
  // User's currently assigned slot label
  String? _userParkedSlotLabel;
  bool _userIsOnLevel1 = true; // true = car, false = bike

  @override
  void initState() {
    super.initState();
    _initializeSlots();
    _loadParkingData();
  }

  void _initializeSlots() {
    _carSlots = {};
    _bikeSlots = {};
    _slotLabelToId.clear();
    _userParkedSlotLabel = null;
    _userIsOnLevel1 = true;
    _isLoading = true;
  }

  // Check if a slot is a bike slot based on label
  bool _isBikeSlot(String label, String? vehicleType) {
    if (vehicleType?.toLowerCase() == 'bike') return true;
    return label.toLowerCase().contains('bike');
  }

  Future<void> _loadParkingData() async {
    setState(() => _isLoading = true);

    final slotsResult = await _parkingService.getSlotsList();
    final mySlotResult = await _parkingService.getMySlot();
    String? userSlotLabel;

    // First check if user has active parking
    if (mySlotResult['success'] == true) {
      final data = mySlotResult['data'] ?? {};
      final hasActiveParking = data['has_active_parking'] == true || 
                                data['has_active_parking']?.toString().toLowerCase() == 'true';
      if (hasActiveParking) {
        userSlotLabel = data['slot']?['slot_label']?.toString() ?? 
                        data['slot']?['slot_code']?.toString();
      }
    }

    if (slotsResult['success'] == true) {
      final data = slotsResult['data'] ?? {};
      final slots = List<Map<String, dynamic>>.from(data['slots'] ?? []);
      _applySlotsFromBackend(slots, userSlotLabel);
    } else {
      // Even if slots list fails, show user's parked slot if they have one
      if (userSlotLabel != null) {
        final isBike = _isBikeSlot(userSlotLabel, null);
        setState(() {
          _userParkedSlotLabel = userSlotLabel;
          _userIsOnLevel1 = !isBike;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    }
  }

  void _applySlotsFromBackend(List<Map<String, dynamic>> slots, String? userSlotLabel) {
    final carSlots = <String, SlotType>{};
    final bikeSlots = <String, SlotType>{};

    _slotLabelToId.clear();

    for (final slot in slots) {
      final slotId = (slot['id'] ?? '').toString();
      final slotLabel = (slot['slot_label'] ?? '').toString();
      final parkingType = (slot['parking_type'] ?? '').toString().toLowerCase();
      final vehicleType = (slot['vehicle_type'] ?? '').toString().toLowerCase();
      
      // Only show employee slots
      if (parkingType != 'employee') continue;
      
      // Check if this is user's slot
      final isUserSlot = userSlotLabel != null && slotLabel == userSlotLabel;

      _slotLabelToId[slotLabel] = slotId;

      final status = (slot['status'] ?? '').toString().toLowerCase();
      var type = status == 'available' ? SlotType.free : SlotType.busy;
      
      if (isUserSlot) {
        type = SlotType.yours;
      }

      // Separate cars and bikes
      if (_isBikeSlot(slotLabel, vehicleType)) {
        bikeSlots[slotLabel] = type;
      } else {
        carSlots[slotLabel] = type;
      }
    }

    // Determine if user is on Level 1 (cars) or Level 2 (bikes)
    bool userIsOnLevel1 = true;
    if (userSlotLabel != null) {
      userIsOnLevel1 = !_isBikeSlot(userSlotLabel, null);
    }

    setState(() {
      _carSlots = carSlots;
      _bikeSlots = bikeSlots;
      _userParkedSlotLabel = userSlotLabel;
      _userIsOnLevel1 = userIsOnLevel1;
      _isLoading = false;
    });
  }

  // Get current level slots
  Map<String, SlotType> get _currentSlots => _isLevel1 ? _carSlots : _bikeSlots;

  // Auto-assign parking slot
  Future<void> _tapToPark() async {
    if (_isParkingAction) return;
    setState(() => _isParkingAction = true);

    final result = await _parkingService.allocateParking();
    if (!mounted) return;

    if (result['success'] == true) {
      final slotLabel = result['data']?['slot_label']?.toString() ?? 
                         result['data']?['slot_code']?.toString() ?? 'Slot';
      await _loadParkingData();
      if (!mounted) return;
      SnackbarHelper.showSuccess(context, 'Parking slot $slotLabel assigned to you!');
    } else {
      final msg = result['message'] ?? 'Failed to allocate parking';
      // If user already has parking, reload data to show their slot
      if (msg.toLowerCase().contains('already have')) {
        await _loadParkingData();
        if (!mounted) return;
      }
      SnackbarHelper.showWarning(context, msg);
    }

    if (mounted) {
      setState(() => _isParkingAction = false);
    }
  }

  // Exit parking
  Future<void> _exitParking() async {
    if (_userParkedSlotLabel == null || _isParkingAction) return;
    setState(() => _isParkingAction = true);

    final result = await _parkingService.releaseParking();
    if (!mounted) return;

    if (result['success'] == true) {
      await _loadParkingData();
      if (!mounted) return;
      SnackbarHelper.showSuccess(context, 'You have exited the parking');
    } else {
      SnackbarHelper.showWarning(context, result['message'] ?? 'Failed to release parking');
    }

    if (mounted) {
      setState(() => _isParkingAction = false);
    }
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
                      if (_userParkedSlotLabel != null)
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
    final bool isParked = _userParkedSlotLabel != null;
    final bool isOnCurrentLevel = _userIsOnLevel1 == _isLevel1;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: (_isLoading || _isParkingAction)
              ? null
              : isParked
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
                    ? (isOnCurrentLevel ? 'EXIT PARKING' : 'PARKED ON ${_userIsOnLevel1 ? "CAR PARKING" : "BIKE PARKING"}')
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
          // Removed the yellow slot box per design request. Slot label
          // is shown in the text section instead.
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
                  '$_userParkedSlotLabel (${_userIsOnLevel1 ? "Car Parking" : "Bike Parking"})',
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
    if (_isLoading) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFFCFD8DC),
          borderRadius: BorderRadius.circular(32),
        ),
        child: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    // Get slots dynamically from backend data
    final slots = _currentSlots.keys.toList()..sort();
    
    if (slots.isEmpty) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(48),
        decoration: BoxDecoration(
          color: const Color(0xFFCFD8DC),
          borderRadius: BorderRadius.circular(32),
        ),
        child: Center(
          child: Text(
            _isLevel1 ? 'No car parking slots available' : 'No bike parking slots available',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),
      );
    }

    // Split into two columns evenly
    final midpoint = (slots.length / 2).ceil();
    final leftSlots = slots.sublist(0, midpoint);
    final rightSlots = slots.length > midpoint ? slots.sublist(midpoint) : <String>[];

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
            if (slots.length > 3)
           Positioned(
            left: 0, right: 0, top: 180,
            child: Icon(Icons.arrow_upward, color: Colors.white.withValues(alpha: 0.5), size: 20),
           ),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  children: leftSlots.map((slotLabel) {
                    final type = _currentSlots[slotLabel] ?? SlotType.free;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _buildSlot(type: type, label: slotLabel),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(width: 40), // Road width
              Expanded(
                child: Column(
                  children: rightSlots.map((slotLabel) {
                    final type = _currentSlots[slotLabel] ?? SlotType.free;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _buildSlot(type: type, label: slotLabel),
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
              behavior: HitTestBehavior.opaque,
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
                    : const BoxDecoration(color: Colors.transparent),
                child: Center(
                  child: Text(
                    'CARS',
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
              behavior: HitTestBehavior.opaque,
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
                    : const BoxDecoration(color: Colors.transparent),
                child: Center(
                  child: Text(
                    'BIKES',
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
    
    // Shorten label for display (e.g., "Employee A1" -> "Emp A1", "Bike Bay 1" -> "Bike 1")
    String shortLabel = label
        .replaceAll('Employee ', 'Emp ')
        .replaceAll('Bike Bay ', 'Bike ');

    switch (type) {
      case SlotType.free:
        bgColor = Colors.white;
        content = Center(
          child: Text(
            shortLabel,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF1A237E),
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        );
        break;
      case SlotType.yours:
        bgColor = Colors.amber;
        content = Center(
          child: Text(
            shortLabel,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        );
        break;
      case SlotType.busy:
        bgColor = const Color(0xFF90A4AE);
        // Determine whether this slot is a bike slot. Prefer explicit label check,
        // but also consider current level (bike view) for robustness.
        final bool isBike = _isBikeSlot(label, null) || !_isLevel1;
        final IconData vehicleIcon = isBike ? Icons.pedal_bike : Icons.directions_car;
        content = Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(vehicleIcon, color: Colors.white54, size: 20),
              Text(
                shortLabel,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white54,
                  fontWeight: FontWeight.bold,
                  fontSize: 10,
                ),
              ),
            ],
          ),
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
