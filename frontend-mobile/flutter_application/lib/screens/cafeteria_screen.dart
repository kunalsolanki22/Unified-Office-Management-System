import 'package:flutter/material.dart';

class CafeteriaScreen extends StatefulWidget {
  final bool initialShowDeskBooking;

  const CafeteriaScreen({
    super.key,
    this.initialShowDeskBooking = false,
  });

  @override
  State<CafeteriaScreen> createState() => _CafeteriaScreenState();
}

class _CafeteriaScreenState extends State<CafeteriaScreen> {

  late bool _isOrderingFood; // Toggle state

  @override
  void initState() {
    super.initState();
    _isOrderingFood = !widget.initialShowDeskBooking;
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
              child: _isOrderingFood
                  ? _buildFoodMenu()
                  : _buildDeskBookingView(),
            ),
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
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'CAFETERIA HUB',
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey[500],
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Text(
                'Service Booking',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A2E),
                ),
              ),
            ],
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

  Widget _buildToggleButtons() {
    return Container(
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
              onTap: () {
                setState(() {
                  _isOrderingFood = true;
                });
              },
              child: Container(
                margin: const EdgeInsets.all(4),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: _isOrderingFood
                    ? BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
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
                    'ORDER FOOD',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: _isOrderingFood
                          ? const Color(0xFF1A237E)
                          : Colors.grey,
                    ),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _isOrderingFood = false;
                });
              },
              child: Container(
                margin: const EdgeInsets.all(4),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: !_isOrderingFood
                    ? BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
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
                    'BOOK DESK',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: !_isOrderingFood
                          ? const Color(0xFF1A237E)
                          : Colors.grey,
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

  Widget _buildFoodMenu() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildToggleButtons(),
        const SizedBox(height: 24),
        _buildMenuItem(
          icon: Icons.lunch_dining,
          iconColor: Colors.orange,
          iconBgColor: Colors.orange.shade50,
          name: 'Gourmet Veggie Platter',
          price: '\$12.50',
          isLunch: true,
        ),
        const SizedBox(height: 16),
        _buildMenuItem(
          icon: Icons.rice_bowl,
          iconColor: Colors.green,
          iconBgColor: Colors.green.shade50,
          name: 'Detox Grain Bowl',
          price: '\$10.00',
          isLunch: false,
          subtitle: 'FRESHLY PREPARED',
        ),
        const SizedBox(height: 24),
        _buildConfirmButton(label: 'CONFIRM ORDER (0 ITEMS)'),
      ],
    );
  }

  Widget _buildDeskBookingView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildToggleButtons(),
        const SizedBox(height: 24),
        _buildZoneSection(
          zoneName: 'ZONE A: MAIN HALL',
          freeCount: 8,
          desks: [
            _DeskItem(label: 'A1', status: DeskStatus.booked),
            _DeskItem(label: 'A2', status: DeskStatus.available),
            _DeskItem(label: 'A3', status: DeskStatus.available),
            _DeskItem(label: 'A4', status: DeskStatus.booked),
            _DeskItem(label: 'A5', status: DeskStatus.available),
            _DeskItem(label: 'A6', status: DeskStatus.available),
            _DeskItem(label: 'A7', status: DeskStatus.selected),
            _DeskItem(label: 'A8', status: DeskStatus.available),
          ],
        ),
        const SizedBox(height: 24),
        _buildZoneSection(
          zoneName: 'ZONE B: WINDOW SIDE',
          desks: [
            _DeskItem(label: 'B1', status: DeskStatus.available),
            _DeskItem(label: 'B2', status: DeskStatus.available),
            _DeskItem(label: 'B3', status: DeskStatus.booked),
            _DeskItem(label: 'B4', status: DeskStatus.available),
          ],
        ),
        const SizedBox(height: 32),
        _buildLegend(),
        const SizedBox(height: 24),
        _buildConfirmButton(label: 'CONFIRM DESK BOOKING'),
      ],
    );
  }

  Widget _buildZoneSection({
    required String zoneName,
    int? freeCount,
    required List<_DeskItem> desks,
  }) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              zoneName,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.grey[400],
                letterSpacing: 1.0,
              ),
            ),
            if (freeCount != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '$freeCount FREE',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.blue.shade100.withValues(alpha: 0.5), width: 1),
            borderRadius: BorderRadius.circular(24),
            color: Colors.blue.shade50.withValues(alpha: 0.2), 
          ),
          child: Wrap(
            spacing: 12,
            runSpacing: 12,
            children: desks.map((desk) => _buildDesk(desk)).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildDesk(_DeskItem desk) {
    Color? bgColor;
    Color textColor;
    
    switch (desk.status) {
      case DeskStatus.available:
        bgColor = Colors.white;
        textColor = const Color(0xFF1A237E);
        break;
      case DeskStatus.selected:
        bgColor = const Color(0xFF1A237E);
        textColor = Colors.yellow;
        break;
      case DeskStatus.booked:
        bgColor = Colors.grey[300];
        textColor = Colors.grey[400]!;
        break;
    }

    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: desk.status == DeskStatus.booked
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Center(
        child: Text(
          desk.label,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
      ),
    );
  }

  Widget _buildLegend() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildLegendItem('AVAILABLE', Colors.white, borderColor: Colors.grey[300]),
        _buildLegendItem('SELECTED', const Color(0xFF1A237E)),
        _buildLegendItem('BOOKED', Colors.grey[300]!),
      ],
    );
  }
  
  Widget _buildLegendItem(String label, Color color, {Color? borderColor}) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: borderColor != null ? Border.all(color: borderColor) : null,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Colors.grey[500],
          ),
        ),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required String name,
    required String price,
    required bool isLunch,
    String? subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: iconColor, size: 32),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle ?? (isLunch ? 'AVAILABLE FOR LUNCH' : ''),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[400],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  price,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A237E),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: Size.zero, 
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('ADD', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmButton({required String label}) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () {},
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1A237E),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.0,
          ),
        ),
      ),
    );
  }
}

enum DeskStatus { available, booked, selected }

class _DeskItem {
  final String label;
  final DeskStatus status;

  _DeskItem({required this.label, required this.status});
}
