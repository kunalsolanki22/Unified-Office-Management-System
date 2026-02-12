import 'dart:async';
import 'dart:ui';

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

// Cart item model
class CartItem {
  final String id;
  final String name;
  final String price;
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  int quantity;

  CartItem({
    required this.id,
    required this.name,
    required this.price,
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    this.quantity = 1,
  });

  double get priceValue => double.parse(price.replaceAll('\$', ''));
  double get totalPrice => priceValue * quantity;
}

class _CafeteriaScreenState extends State<CafeteriaScreen> {

  late bool _isOrderingFood; // Toggle state
  final ScrollController _scrollController = ScrollController();
  
  // Cart state
  final Map<String, CartItem> _cart = {};
  bool _showCartOverlay = false;

  // Desk booking state
  late Map<String, _DeskItem> _desks;
  String? _selectedDeskId;
  String? _userBookedDeskId; // The desk this user has booked

  int get _totalCartItems => _cart.values.fold(0, (sum, item) => sum + item.quantity);
  double get _totalCartPrice => _cart.values.fold(0.0, (sum, item) => sum + item.totalPrice);

  // Initialize desks
  void _initializeDesks() {
    _desks = {
      'A1': _DeskItem(label: 'A1', status: DeskStatus.booked),
      'A2': _DeskItem(label: 'A2', status: DeskStatus.available),
      'A3': _DeskItem(label: 'A3', status: DeskStatus.available),
      'A4': _DeskItem(label: 'A4', status: DeskStatus.booked),
      'A5': _DeskItem(label: 'A5', status: DeskStatus.available),
      'A6': _DeskItem(label: 'A6', status: DeskStatus.available),
      'A7': _DeskItem(label: 'A7', status: DeskStatus.available),
      'A8': _DeskItem(label: 'A8', status: DeskStatus.available),
      'B1': _DeskItem(label: 'B1', status: DeskStatus.available),
      'B2': _DeskItem(label: 'B2', status: DeskStatus.available),
      'B3': _DeskItem(label: 'B3', status: DeskStatus.booked),
      'B4': _DeskItem(label: 'B4', status: DeskStatus.available),
    };
  }

  // Get available desk count
  int _getAvailableDeskCount(List<String> deskIds) {
    return deskIds.where((id) => 
      _desks[id]?.status == DeskStatus.available || 
      _desks[id]?.status == DeskStatus.selected
    ).length;
  }

  // Handle desk tap
  void _onDeskTap(String deskId) {
    final desk = _desks[deskId];
    if (desk == null) return;

    // Can't tap booked or freezed desks
    if (desk.status == DeskStatus.booked || desk.status == DeskStatus.freezed) {
      return;
    }

    // If user already has a booked desk, show message
    if (_userBookedDeskId != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('You already have desk $_userBookedDeskId booked. You can only book one desk at a time.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      // If there was a previously selected desk, unselect it and cancel its freeze timer
      if (_selectedDeskId != null && _selectedDeskId != deskId) {
        final previousDesk = _desks[_selectedDeskId!];
        if (previousDesk != null && previousDesk.status == DeskStatus.selected) {
          previousDesk.freezeTimer?.cancel();
          previousDesk.status = DeskStatus.available;
        }
      }

      // If clicking on already selected desk, deselect it
      if (desk.status == DeskStatus.selected) {
        desk.freezeTimer?.cancel();
        desk.status = DeskStatus.available;
        _selectedDeskId = null;
      } else {
        // Select the desk and start freeze timer
        desk.status = DeskStatus.selected;
        _selectedDeskId = deskId;
        
        // Start 1-minute freeze timer
        desk.freezeTimer?.cancel();
        desk.freezeTimer = Timer(const Duration(minutes: 1), () {
          if (mounted && _desks[deskId]?.status == DeskStatus.selected) {
            setState(() {
              _desks[deskId]!.status = DeskStatus.freezed;
              if (_selectedDeskId == deskId) {
                _selectedDeskId = null;
              }
            });
          }
        });
      }
    });
  }

  // Confirm desk booking
  void _confirmDeskBooking() {
    if (_selectedDeskId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a desk first'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_userBookedDeskId != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('You already have desk $_userBookedDeskId booked.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      final desk = _desks[_selectedDeskId!];
      if (desk != null) {
        desk.freezeTimer?.cancel();
        desk.status = DeskStatus.booked;
        _userBookedDeskId = _selectedDeskId;
        _selectedDeskId = null;
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Desk $_userBookedDeskId booked successfully!'),
        backgroundColor: const Color(0xFF1A237E),
      ),
    );
  }

  void _addToCart(String id, String name, String price, IconData icon, Color iconColor, Color iconBgColor) {
    setState(() {
      if (_cart.containsKey(id)) {
        _cart[id]!.quantity++;
      } else {
        _cart[id] = CartItem(
          id: id,
          name: name,
          price: price,
          icon: icon,
          iconColor: iconColor,
          iconBgColor: iconBgColor,
        );
      }
    });
  }

  void _removeFromCart(String id) {
    setState(() {
      if (_cart.containsKey(id)) {
        if (_cart[id]!.quantity > 1) {
          _cart[id]!.quantity--;
        } else {
          _cart.remove(id);
        }
      }
    });
  }

  int _getItemQuantity(String id) {
    return _cart[id]?.quantity ?? 0;
  }

  @override
  void initState() {
    super.initState();
    _isOrderingFood = !widget.initialShowDeskBooking;
    _initializeDesks();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    // Cancel all freeze timers
    for (final desk in _desks.values) {
      desk.freezeTimer?.cancel();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
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
                    child: _isOrderingFood
                        ? _buildFoodMenu()
                        : _buildDeskBookingView(),
                  ),
                ),
                // View Cart button at bottom when items in cart
                if (_isOrderingFood && _totalCartItems > 0)
                  _buildViewCartButton(),
              ],
            ),
            // Cart overlay
            if (_showCartOverlay)
              _buildCartOverlay(),
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

  Widget _buildSearchBar() {
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
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search for food...',
          hintStyle: TextStyle(
            color: Colors.grey[400],
            fontSize: 14,
          ),
          prefixIcon: Icon(Icons.search, color: Colors.grey[400]),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
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
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      children: [
        _buildToggleButtons(),
        const SizedBox(height: 16),
        _buildSearchBar(),
        const SizedBox(height: 16),
        _buildMenuItem(
          id: 'gourmet_veggie_platter',
          icon: Icons.lunch_dining,
          iconColor: Colors.orange,
          iconBgColor: Colors.orange.shade50,
          name: 'Gourmet Veggie Platter',
          price: '\$12.50',
          isLunch: true,
        ),
        const SizedBox(height: 16),
        _buildMenuItem(
          id: 'detox_grain_bowl',
          icon: Icons.rice_bowl,
          iconColor: Colors.green,
          iconBgColor: Colors.green.shade50,
          name: 'Detox Grain Bowl',
          price: '\$10.00',
          isLunch: false,
          subtitle: 'FRESHLY PREPARED',
        ),
        // Add extra padding at bottom when cart bar is visible
        if (_totalCartItems > 0)
          const SizedBox(height: 80),
      ],
    );
  }

  Widget _buildDeskBookingView() {
    final zoneADesks = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
    final zoneBDesks = ['B1', 'B2', 'B3', 'B4'];

    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      children: [
        _buildToggleButtons(),
        const SizedBox(height: 24),
        _buildZoneSection(
          zoneName: 'ZONE A: MAIN HALL',
          freeCount: _getAvailableDeskCount(zoneADesks),
          deskIds: zoneADesks,
        ),
        const SizedBox(height: 24),
        _buildZoneSection(
          zoneName: 'ZONE B: WINDOW SIDE',
          freeCount: _getAvailableDeskCount(zoneBDesks),
          deskIds: zoneBDesks,
        ),
        const SizedBox(height: 32),
        _buildLegend(),
        const SizedBox(height: 24),
        _buildDeskConfirmButton(),
      ],
    );
  }

  Widget _buildZoneSection({
    required String zoneName,
    int? freeCount,
    required List<String> deskIds,
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
            children: deskIds.map((id) => _buildDesk(id)).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildDesk(String deskId) {
    final desk = _desks[deskId];
    if (desk == null) return const SizedBox();
    
    Color? bgColor;
    Color textColor;
    Border? border;
    
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
      case DeskStatus.freezed:
        bgColor = Colors.grey[300];
        textColor = Colors.grey[600]!;
        border = Border.all(color: Colors.black, width: 2);
        break;
    }

    final bool isTappable = desk.status == DeskStatus.available || desk.status == DeskStatus.selected;

    return GestureDetector(
      onTap: isTappable ? () => _onDeskTap(deskId) : null,
      child: Container(
        width: 60,
        height: 60,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: border,
          boxShadow: (desk.status == DeskStatus.booked || desk.status == DeskStatus.freezed)
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
      ),
    );
  }

  Widget _buildLegend() {
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 16,
      runSpacing: 8,
      children: [
        _buildLegendItem('AVAILABLE', Colors.white, borderColor: Colors.grey[300]),
        _buildLegendItem('SELECTED', const Color(0xFF1A237E)),
        _buildLegendItem('BOOKED', Colors.grey[300]!),
        _buildLegendItem('FREEZED', Colors.grey[300]!, borderColor: Colors.black),
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

  Widget _buildDeskConfirmButton() {
    final hasSelection = _selectedDeskId != null;
    final alreadyBooked = _userBookedDeskId != null;
    
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: (hasSelection && !alreadyBooked) ? _confirmDeskBooking : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1A237E),
          foregroundColor: Colors.white,
          disabledBackgroundColor: Colors.grey[300],
          disabledForegroundColor: Colors.grey[500],
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
        ),
        child: Text(
          alreadyBooked 
              ? 'DESK $_userBookedDeskId BOOKED'
              : hasSelection 
                  ? 'CONFIRM DESK $_selectedDeskId BOOKING'
                  : 'SELECT A DESK TO BOOK',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.0,
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required String id,
    required IconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required String name,
    required String price,
    required bool isLunch,
    String? subtitle,
  }) {
    final quantity = _getItemQuantity(id);
    final isInCart = quantity > 0;

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
          // Cart button with +/- functionality
          isInCart
              ? Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A237E),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Minus button
                      InkWell(
                        onTap: () => _removeFromCart(id),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                          child: const Icon(
                            Icons.remove,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                      // Quantity
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                        child: Text(
                          '$quantity',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      // Plus button
                      InkWell(
                        onTap: () => _addToCart(id, name, price, icon, iconColor, iconBgColor),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                          child: const Icon(
                            Icons.add,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : ElevatedButton(
                  onPressed: () => _addToCart(id, name, price, icon, iconColor, iconBgColor),
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

  // View Cart button that appears at the bottom
  Widget _buildViewCartButton() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: GestureDetector(
          onTap: () {
            setState(() {
              _showCartOverlay = true;
            });
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFF1A237E),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$_totalCartItems ${_totalCartItems == 1 ? 'item' : 'items'} added',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Row(
                  children: [
                    Text(
                      'View Cart',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.white,
                      size: 14,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Cart overlay with blur background
  Widget _buildCartOverlay() {
    return Stack(
      children: [
        // Blurred background - tap to dismiss
        GestureDetector(
          onTap: () {
            setState(() {
              _showCartOverlay = false;
            });
          },
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
            child: Container(
              color: Colors.black.withValues(alpha: 0.3),
            ),
          ),
        ),
        // Cart card
        Positioned(
          left: 16,
          right: 16,
          bottom: 16,
          child: Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.6,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 20,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Your Cart',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1A2E),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _showCartOverlay = false;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.close,
                            size: 20,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                // Cart items
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    itemCount: _cart.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final item = _cart.values.elementAt(index);
                      return _buildCartItem(item);
                    },
                  ),
                ),
                // Total and Confirm button
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(24),
                      bottomRight: Radius.circular(24),
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1A1A2E),
                            ),
                          ),
                          Text(
                            '\$${_totalCartPrice.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1A237E),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            // Handle order confirmation
                            setState(() {
                              _showCartOverlay = false;
                              _cart.clear();
                            });
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Order confirmed successfully!'),
                                backgroundColor: Color(0xFF1A237E),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1A237E),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'CONFIRM ORDER',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Individual cart item in the overlay
  Widget _buildCartItem(CartItem item) {
    return Row(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: item.iconBgColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(item.icon, color: item.iconColor, size: 24),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.name,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A1A2E),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '\$${item.totalPrice.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF1A237E),
                ),
              ),
            ],
          ),
        ),
        // Quantity controls
        Container(
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              InkWell(
                onTap: () => _removeFromCart(item.id),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  child: Icon(
                    Icons.remove,
                    size: 16,
                    color: Colors.grey[700],
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  '${item.quantity}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
              ),
              InkWell(
                onTap: () => _addToCart(
                  item.id,
                  item.name,
                  item.price,
                  item.icon,
                  item.iconColor,
                  item.iconBgColor,
                ),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  child: Icon(
                    Icons.add,
                    size: 16,
                    color: Colors.grey[700],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

enum DeskStatus { available, booked, selected, freezed }

class _DeskItem {
  final String label;
  DeskStatus status;
  Timer? freezeTimer;

  _DeskItem({required this.label, required this.status});
}
