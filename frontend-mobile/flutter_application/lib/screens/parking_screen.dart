import 'package:flutter/material.dart';

class ParkingScreen extends StatefulWidget {
  const ParkingScreen({super.key});

  @override
  State<ParkingScreen> createState() => _ParkingScreenState();
}

class _ParkingScreenState extends State<ParkingScreen> {
  bool _isLevel1 = true;

  String? _selectedSlotId;
  SlotType? _selectedSlotStatus;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(context),
            _buildLevelToggle(),
            const SizedBox(height: 24),
            Expanded(
              child: _buildParkingGrid(),
            ),
             _buildBottomPanel(),
          ],
        ),
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
          Container(
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
                _selectedSlotId = null; // Reset selection
                _selectedSlotStatus = null;
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
                _selectedSlotId = null; // Reset selection
                _selectedSlotStatus = null;
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

  Widget _buildParkingGrid() {
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
          Center(
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
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildTappableSlot(type: SlotType.busy, label: ''),
                    _buildTappableSlot(type: SlotType.yours, label: 'A-02'),
                    _buildTappableSlot(type: SlotType.free, label: 'A-03'),
                    _buildTappableSlot(type: SlotType.busy, label: ''),
                    _buildTappableSlot(type: SlotType.free, label: 'A-05'),
                  ],
                ),
              ),
              const SizedBox(width: 40), // Road width
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildTappableSlot(type: SlotType.free, label: 'B-01'),
                    _buildTappableSlot(type: SlotType.busy, label: ''),
                    _buildTappableSlot(type: SlotType.free, label: 'B-03'),
                    _buildTappableSlot(type: SlotType.free, label: 'B-04'),
                    _buildTappableSlot(type: SlotType.busy, label: ''),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTappableSlot({required SlotType type, required String label}) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedSlotId = label;
          _selectedSlotStatus = type;
        });
      },
      child: _buildSlot(type: type, label: label),
    );
  }

  Widget _buildSlot({required SlotType type, required String label}) {
    Color bgColor;
    Color textColor;
    Widget? content;
    
    // Highlight if selected
    bool isSelected = _selectedSlotId == label && label.isNotEmpty;

    switch (type) {
      case SlotType.free:
        bgColor = Colors.white;
        textColor = const Color(0xFF1A237E);
        content = Center(child: Text(label, style: TextStyle(color: textColor, fontWeight: FontWeight.bold)));
        break;
      case SlotType.yours:
        bgColor = Colors.amber;
        textColor = Colors.black;
        content = Center(child: Text(label, style: TextStyle(color: textColor, fontWeight: FontWeight.bold)));
        break;
      case SlotType.busy:
        bgColor = const Color(0xFF90A4AE); // Steel Blue/Grey
        textColor = Colors.transparent;
        content = const Center(child: Icon(Icons.directions_car, color: Colors.white54));
        break;
    }

    return Container(
      height: 60,
      width: double.infinity,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        border: isSelected ? Border.all(color: Colors.blue, width: 2) : null, // Add blue border if selected
      ),
      child: content,
    );
  }

  Widget _buildBottomPanel() {
    if (_selectedSlotStatus == null) return const SizedBox(height: 16);

    String title = 'CONFIRM SLOT';
    String mainText = _selectedSlotId?.isEmpty == true ? 'Unknown' : _selectedSlotId!;
    Color btnColor = Colors.amber;
    String btnText = 'BOOK SPACE';
    VoidCallback? onPressed = () {};

    if (_selectedSlotStatus == SlotType.busy) {
      title = 'STATUS';
      mainText = 'Already Booked';
      btnColor = Colors.grey;
      btnText = 'UNAVAILABLE';
      onPressed = null;
    } else if (_selectedSlotStatus == SlotType.yours) {
      title = 'STATUS';
      mainText = 'Your Slot';
      btnColor = Colors.green;
      btnText = 'NAVIGATE';
    } else if (_selectedSlotStatus == SlotType.free) {
       // Check if user already has a slot "Yours"
       // in a real app this would be a proper state check. 
       // For this mock, we know A-02 is yours.
       bool hasBookedSlot = true; // Hardcoded for this scenario based on UI
       if (hasBookedSlot) {
         btnColor = Colors.grey;
         btnText = 'LIMIT REACHED';
         onPressed = null;
         // Maybe show toast or just disable
       }
    }

    return Column(
      children: [
        const SizedBox(height: 16),
        _buildLegend(),
        Container(
          width: double.infinity,
          margin: const EdgeInsets.only(top: 24),
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Color(0xFF1A237E),
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(32),
              topRight: Radius.circular(32),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.orange,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Expanded(
                    child: Text(
                      mainText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  ElevatedButton(
                    onPressed: onPressed,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: btnColor,
                      disabledBackgroundColor: btnColor, // Ensure visibility when disabled
                      foregroundColor: Colors.black,
                      disabledForegroundColor: Colors.black, // Ensure text visibility when disabled
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                    child: Text(btnText, style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
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
