import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'my_orders_screen.dart';
import '../services/cafeteria_service.dart';
import '../services/search_service.dart';
import '../utils/snackbar_helper.dart';

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
  final SearchService _searchService = SearchService();

  late bool _isOrderingFood; // Toggle state
  final ScrollController _scrollController = ScrollController();
  final CafeteriaService _cafeteriaService = CafeteriaService();
  
  // Cart state
  final Map<String, CartItem> _cart = {};
  bool _showCartOverlay = false;
  bool _isPlacingOrder = false;

  // Food items from API
  List<Map<String, dynamic>> _foodItems = [];
  List<Map<String, dynamic>> _filteredFoodItems = [];
  bool _isLoadingFood = true;
  String _searchQuery = '';

  // Desk booking state from API
  List<Map<String, dynamic>> _tables = [];
  Set<String> _bookedTableIds = {};
  bool _isLoadingTables = true;
  bool _isBookingDesk = false;
  late Map<String, _DeskItem> _desks;
  String? _selectedDeskId;
  String? _selectedTableUuid;
  String? _userBookedDeskId; // The desk this user has booked

  int get _totalCartItems => _cart.values.fold(0, (sum, item) => sum + item.quantity);
  double get _totalCartPrice => _cart.values.fold(0.0, (sum, item) => sum + item.totalPrice);

  String _getDeskDisplayLabel(String? deskId) {
    if (deskId == null) return '';
    return _desks[deskId]?.label ?? deskId;
  }

  // Initialize desks (empty — populated from API in _fetchTables)
  void _initializeDesks() {
    _desks = {};
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
      SnackbarHelper.showWarning(context, 'You already have desk ${_getDeskDisplayLabel(_userBookedDeskId)} booked. You can only book one desk at a time.');
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
        _selectedTableUuid = null;
      } else {
        // Select the desk and start freeze timer
        desk.status = DeskStatus.selected;
        _selectedDeskId = deskId;
        _selectedTableUuid = desk.tableUuid;
        
        // Start 1-minute freeze timer
        desk.freezeTimer?.cancel();
        desk.freezeTimer = Timer(const Duration(minutes: 1), () {
          if (mounted && _desks[deskId]?.status == DeskStatus.selected) {
            setState(() {
              _desks[deskId]!.status = DeskStatus.freezed;
              if (_selectedDeskId == deskId) {
                _selectedDeskId = null;
                _selectedTableUuid = null;
              }
            });
          }
        });
      }
    });
  }

  // Confirm desk booking via API
  Future<void> _confirmDeskBooking() async {
    if (_selectedDeskId == null || _selectedTableUuid == null) {
      SnackbarHelper.showWarning(context, 'Please select a desk first');
      return;
    }

    if (_userBookedDeskId != null) {
      SnackbarHelper.showWarning(context, 'You already have desk ${_getDeskDisplayLabel(_userBookedDeskId)} booked.');
      return;
    }

    setState(() => _isBookingDesk = true);

    final now = DateTime.now();
    final today = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final startTime = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:00';
    final endHour = (now.hour + 1).clamp(0, 23);
    final endTime = '${endHour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:00';

    final result = await _cafeteriaService.createTableBooking(
      tableId: _selectedTableUuid!,
      bookingDate: today,
      startTime: startTime,
      endTime: endTime,
    );

    if (mounted) {
      setState(() => _isBookingDesk = false);

      if (result['success']) {
        setState(() {
          final desk = _desks[_selectedDeskId!];
          if (desk != null) {
            desk.freezeTimer?.cancel();
            desk.status = DeskStatus.booked;
            _userBookedDeskId = _selectedDeskId;
            _selectedDeskId = null;
            _selectedTableUuid = null;
          }
        });
        SnackbarHelper.showSuccess(context, 'Desk ${_getDeskDisplayLabel(_userBookedDeskId)} booked successfully!');
      } else {
        SnackbarHelper.showError(context, result['message'] ?? 'Failed to book desk');
      }
    }
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
    _fetchFoodItems();
    _fetchTables();
  }

  Future<void> _fetchFoodItems() async {
    final result = await _cafeteriaService.getFoodItems(isAvailable: true);
    if (result['success'] && mounted) {
      setState(() {
        _foodItems = List<Map<String, dynamic>>.from(result['data'] ?? []);
        _filteredFoodItems = _foodItems;
        _isLoadingFood = false;
      });
    } else if (mounted) {
      setState(() => _isLoadingFood = false);
    }
  }

  // Shorten table label for display (e.g., "Center Table 1" -> "Center 1")
  String _shortenTableLabel(String label) {
    return label
        .replaceAll(' Table', '')
        .replaceAll(' Top', '');
  }

  // Get zone key from table type
  String _getZoneKey(String tableType) {
    switch (tableType.toLowerCase()) {
      case 'large': return 'CENTER';
      case 'round': return 'ROUND';
      case 'high': return 'HIGH';
      case 'regular': return 'WINDOW';
      default: return 'OTHER';
    }
  }

  Future<void> _fetchTables() async {
    final tablesResult = await _cafeteriaService.getCafeteriaTables();
    final bookingsResult = await _cafeteriaService.getTodaysBookings();
    final myBookingsResult = await _cafeteriaService.getMyBookings();
    if (mounted) {
      final tables = List<Map<String, dynamic>>.from(tablesResult['data'] ?? []);
      final bookings = List<Map<String, dynamic>>.from(bookingsResult['data'] ?? []);
      final bookedIds = bookings.map((b) => b['table_id']?.toString() ?? '').toSet();

      // Check if user already has a booking for today
      final myBookings = List<Map<String, dynamic>>.from(myBookingsResult['data'] ?? []);
      final today = DateTime.now().toIso8601String().split('T')[0];
      String? userBookedTableId;
      for (final booking in myBookings) {
        final bookingDate = booking['booking_date']?.toString().split('T')[0] ?? '';
        if (bookingDate == today) {
          userBookedTableId = booking['table_id']?.toString();
          break;
        }
      }

      // Update desk map from API data - group by table_type
      _desks.clear();

      // Sort tables by label for consistent ordering
      tables.sort((a, b) => (a['table_label'] ?? '').toString().compareTo((b['table_label'] ?? '').toString()));

      for (final table in tables) {
        final tableId = table['id']?.toString() ?? '';
        if (tableId.isEmpty) continue;
        
        final tableLabel = (table['table_label'] ?? table['table_code'] ?? '').toString();
        final tableType = (table['table_type'] ?? 'regular').toString();
        final isBooked = bookedIds.contains(tableId);
        final isUserBooked = tableId == userBookedTableId;

        DeskStatus status;
        if (isUserBooked) {
          status = DeskStatus.yours;
        } else if (isBooked) {
          status = DeskStatus.booked;
        } else {
          status = DeskStatus.available;
        }

        _desks[tableId] = _DeskItem(
          label: _shortenTableLabel(tableLabel),
          fullLabel: tableLabel,
          zoneKey: _getZoneKey(tableType),
          status: status,
          tableUuid: tableId,
        );
      }
      setState(() {
        _tables = tables;
        _bookedTableIds = bookedIds;
        _userBookedDeskId = userBookedTableId;
        _isLoadingTables = false;
      });
    }
  }

  Future<void> _filterFoodItems(String query) async {
    setState(() {
      _searchQuery = query;
      if (query.isEmpty) {
        _filteredFoodItems = _foodItems;
      }
    });
    if (query.isNotEmpty) {
      final result = await _searchService.semanticSearch(query: query, searchType: 'food');
      if (result['success'] == true && result['data'] != null && result['data']['results'] != null) {
        setState(() {
          _filteredFoodItems = List<Map<String, dynamic>>.from(
            (result['data']['results'] as List).map((e) => e['item'])
          );
        });
      } else {
        setState(() {
          _filteredFoodItems = [];
        });
        SnackbarHelper.showError(context, result['message'] ?? 'Semantic search failed');
      }
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'lunch': return Icons.lunch_dining;
      case 'beverages': return Icons.coffee;
      case 'snacks': return Icons.cookie;
      case 'breakfast': return Icons.breakfast_dining;
      default: return Icons.restaurant;
    }
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'lunch': return Colors.orange;
      case 'beverages': return Colors.blue;
      case 'snacks': return Colors.purple;
      case 'breakfast': return Colors.amber;
      default: return Colors.teal;
    }
  }

  Future<void> _placeOrder() async {
    if (_cart.isEmpty) return;
    
    setState(() => _isPlacingOrder = true);
    
    final items = _cart.values.map((item) => {
      'food_item_id': item.id,
      'quantity': item.quantity,
    }).toList();
    
    final result = await _cafeteriaService.createFoodOrder(items: items);
    
    if (mounted) {
      setState(() {
        _isPlacingOrder = false;
        if (result['success']) {
          _showCartOverlay = false;
          _cart.clear();
        }
      });
      
      if (result['success']) {
        final orderData = result['data'];
        final orderNum = orderData?['order_number'] ?? '';
        SnackbarHelper.showSuccess(context, 'Order $orderNum placed successfully!');
      } else {
        SnackbarHelper.showError(context, result['message'] ?? 'Failed to place order');
      }
    }
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
        onChanged: (q) => _filterFoodItems(q),
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

  Widget _buildViewMyOrdersButton() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1A237E).withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const MyOrdersScreen()),
            );
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.receipt_long_outlined,
                    color: const Color(0xFF1A237E), size: 24),
                const SizedBox(width: 12),
                const Text(
                  'VIEW MY ORDERS',
                  style: TextStyle(
                    color: Color(0xFF1A237E),
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(width: 8),
                Icon(Icons.arrow_forward_ios,
                    color: const Color(0xFF1A237E).withValues(alpha: 0.5),
                    size: 16),
              ],
            ),
          ),
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
        _buildViewMyOrdersButton(), // Added button
        const SizedBox(height: 24),

        if (_isLoadingFood)
          const Padding(
            padding: EdgeInsets.all(40),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_filteredFoodItems.isEmpty)
          Padding(
            padding: const EdgeInsets.all(40),
            child: Center(
              child: Text(
                _searchQuery.isNotEmpty ? 'No items match your search' : 'No food items available',
                style: TextStyle(color: Colors.grey[500], fontSize: 14),
              ),
            ),
          )
        else
          ..._filteredFoodItems.map((item) {
            final category = (item['category_name'] ?? 'lunch').toString();
            final iconColor = _getCategoryColor(category);
            final itemId = item['id']?.toString() ?? '';
            final price = double.tryParse(item['price']?.toString() ?? '0') ?? 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _buildMenuItem(
                id: itemId,
                icon: _getCategoryIcon(category),
                iconColor: iconColor,
                iconBgColor: iconColor.withValues(alpha: 0.1),
                name: item['name'] ?? '',
                price: '\$${price.toStringAsFixed(2)}',
                isLunch: category == 'lunch',
                subtitle: category.toUpperCase(),
              ),
            );
          }),
        // Add extra padding at bottom when cart bar is visible
        if (_totalCartItems > 0)
          const SizedBox(height: 80),
      ],
    );
  }

  Widget _buildDeskBookingView() {
    if (_isLoadingTables) {
      return ListView(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        children: [
          _buildToggleButtons(),
          const SizedBox(height: 24),
          const Padding(
            padding: EdgeInsets.all(40),
            child: Center(child: CircularProgressIndicator()),
          ),
        ],
      );
    }

    // Group desks by detected area (based on fullLabel) and assign A1/A2.. labels per area
    final Map<String, List<String>> areas = {};
    String _detectArea(String fullLabel, String zoneKey) {
      final label = fullLabel.toLowerCase();
      if (label.contains('window')) return 'WINDOW';
      if (label.contains('corner')) return 'CORNER';
      if (label.contains('open area') || label.contains('open')) return 'OPEN';
      if (label.contains('quiet')) return 'QUIET';
      // fallback to zoneKey
      return zoneKey;
    }

    for (final entry in _desks.entries) {
      final area = _detectArea(entry.value.fullLabel, entry.value.zoneKey);
      areas.putIfAbsent(area, () => []).add(entry.key);
    }

    final areaNames = {
      'WINDOW': 'Window Desks',
      'CORNER': 'Corner Desks',
      'OPEN': 'Open Area',
      'QUIET': 'Quiet Zone',
      'CENTER': 'Center Tables (Large)',
      'ROUND': 'Round Tables',
      'HIGH': 'High Top Tables',
      'OTHER': 'Other Tables',
    };

    // Preferred ordering for areas
    final areaOrder = ['WINDOW', 'CORNER', 'OPEN', 'QUIET', 'CENTER', 'ROUND', 'HIGH', 'OTHER'];

    // Letter prefixes per area for labeling (A, B, C, D...)
    final Map<String, String> areaLetter = {
      'WINDOW': 'A',
      'CORNER': 'B',
      'OPEN': 'C',
      'QUIET': 'D',
      'CENTER': 'E',
      'ROUND': 'F',
      'HIGH': 'G',
      'OTHER': 'H',
    };

    // Sort desks in each area by fullLabel and assign sequential labels like A1, A2...
    for (final a in areas.keys) {
      areas[a]!.sort((x, y) => _desks[x]!.fullLabel.compareTo(_desks[y]!.fullLabel));
      final prefix = areaLetter[a] ?? 'Z';
      for (var i = 0; i < areas[a]!.length; i++) {
        final id = areas[a]![i];
        _desks[id]!.label = '$prefix${i + 1}';
      }
    }

    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      children: [
        _buildToggleButtons(),
        const SizedBox(height: 24),
        // Show user's booked table info if they have one
        if (_userBookedDeskId != null)
          _buildYourTableCard(),
        if (_userBookedDeskId != null)
          const SizedBox(height: 16),
        if (_desks.isEmpty)
          Padding(
            padding: const EdgeInsets.all(40),
            child: Center(
              child: Text(
                'No tables available',
                style: TextStyle(color: Colors.grey[500], fontSize: 14),
              ),
            ),
          )
        else
          ...areaOrder.where(areas.containsKey).map((areaKey) {
            final deskIds = areas[areaKey]!;
            final areaName = areaNames[areaKey] ?? areaKey;
            return Column(
              children: [
                _buildZoneSection(
                  zoneName: areaName,
                  freeCount: _getAvailableDeskCount(deskIds),
                  deskIds: deskIds,
                ),
                const SizedBox(height: 24),
              ],
            );
          }),
        _buildLegend(),
        const SizedBox(height: 24),
        _buildDeskConfirmButton(),
      ],
    );
  }

  Widget _buildYourTableCard() {
    final desk = _desks[_userBookedDeskId];
    if (desk == null) return const SizedBox();
    
    return Container(
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
                desk.label,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: Colors.black,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'YOUR BOOKED TABLE',
                  style: TextStyle(
                    color: Colors.orange,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desk.fullLabel,
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
            Icons.table_restaurant,
            color: Colors.white,
            size: 32,
          ),
        ],
      ),
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
      case DeskStatus.yours:
        bgColor = Colors.amber;
        textColor = Colors.black;
        border = Border.all(color: Colors.amber.shade700, width: 2);
        break;
      case DeskStatus.booked:
        bgColor = const Color(0xFF90A4AE);
        textColor = Colors.white;
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
        width: 72,
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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (desk.status == DeskStatus.booked)
                Icon(Icons.event_seat, color: textColor, size: 18),
              Text(
                desk.label,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                  color: textColor,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
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
        _buildLegendItem('YOURS', Colors.amber, borderColor: Colors.amber.shade700),
        _buildLegendItem('SELECTED', const Color(0xFF1A237E)),
        _buildLegendItem('BOOKED', const Color(0xFF90A4AE)),
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
            ? 'DESK ${_getDeskDisplayLabel(_userBookedDeskId)} BOOKED'
              : hasSelection 
              ? 'CONFIRM DESK ${_getDeskDisplayLabel(_selectedDeskId)} BOOKING'
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
                          onPressed: _isPlacingOrder ? null : _placeOrder,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1A237E),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                          child: _isPlacingOrder
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : const Text(
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

enum DeskStatus { available, booked, selected, freezed, yours }

class _DeskItem {
  String label;
  final String fullLabel;
  final String zoneKey;
  final String? tableUuid;
  DeskStatus status;
  Timer? freezeTimer;

  _DeskItem({
    required this.label,
    required this.fullLabel,
    required this.zoneKey,
    required this.status,
    this.tableUuid,
  });
}
