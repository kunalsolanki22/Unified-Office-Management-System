import 'package:flutter/material.dart';
import '../manager_profile_screen.dart';
import '../cafeteria_screen.dart';
import '../parking_screen.dart';
import '../leave_screen.dart';
import '../../widgets/attendance_card.dart';
import '../../main.dart'; // Import main.dart for themeNotifier

class ManagerDashboard extends StatefulWidget {
  final String managerName;

  const ManagerDashboard({super.key, required this.managerName});

  @override
  State<ManagerDashboard> createState() => _ManagerDashboardState();
}

class _ManagerDashboardState extends State<ManagerDashboard> {
  int _selectedIndex = 0;
  final ScrollController _scrollController = ScrollController();

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
        child: Stack(
          children: [
            IndexedStack(
              index: _selectedIndex,
              children: [
                _buildDashboardContent(),
                const LeaveScreen(),
                ManagerProfileScreen(
                  onBack: () {
                    setState(() {
                      _selectedIndex = 0;
                    });
                  },
                ),
              ],
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                margin: const EdgeInsets.all(24),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildNavItem(0, Icons.show_chart, 'DASHBOARD'),
                    const SizedBox(width: 16),
                    _buildNavItem(1, Icons.people, 'LEAVE'),
                    const SizedBox(width: 16),
                    _buildNavItem(2, Icons.person, 'PROFILE'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    bool isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedIndex = index;
        });
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: isSelected
                ? BoxDecoration(
                    color: const Color(0xFF1A237E),
                    borderRadius: BorderRadius.circular(12),
                  )
                : null,
            child: Icon(
              icon,
              color: isSelected ? Colors.white : const Color(0xFF8C8D90), // Grey
              size: 24,
            ),
          ),
          if (isSelected) const SizedBox(height: 4),
          if (isSelected)
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A237E), // Navy Blue
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDashboardContent() {
    return Scrollbar(
      controller: _scrollController,
      thumbVisibility: true,
      trackVisibility: true,
      interactive: true,
      thickness: 8.0,
      radius: const Radius.circular(8),
      child: SingleChildScrollView(
        controller: _scrollController,
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 24),
            _buildAttendanceCard(),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: _buildQuickLinkCard(
                  icon: Icons.restaurant,
                  title: 'Cafeteria',
                  subtitle: 'Manage reservations',
                  color: Colors.orange.shade100,
                  iconColor: Colors.orange,
                )),
                const SizedBox(width: 16),
                Expanded(child: _buildQuickLinkCard(
                  icon: Icons.local_parking,
                  title: 'Parking',
                  subtitle: 'View parking slots',
                  color: Colors.blue.shade100,
                  iconColor: Colors.blue,
                )),
              ],
            ),
            const SizedBox(height: 24),
            _buildTeamOverview(),
            const SizedBox(height: 24),
            _buildAnnouncedHolidays(),
            const SizedBox(height: 120), // Increased space for bottom nav
          ],
        ),
      ),
    );
  }

  String _getInitials(String name) {
    if (name.isEmpty) return 'M';
    
    // Split by non-alphanumeric characters (like dot, space, underscore)
    List<String> parts = name.split(RegExp(r'[^a-zA-Z0-9]'));
    parts = parts.where((p) => p.isNotEmpty).toList();

    if (parts.isEmpty) return name[0].toUpperCase();

    if (parts.length == 1) {
      if (parts[0].length > 1) {
         return parts[0].substring(0, 2).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }

    // Take first letter of first two parts
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'MANAGER PORTAL',
                style: TextStyle(
                  fontSize: 12,
                  color: const Color(0xFF8C8D90), // Grey
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Good Morning, ${widget.managerName}',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.white
                      : const Color(0xFF1A237E), // Navy Blue
                ),
              ),
            ],
          ),
        ),
        Row(
          children: [
            IconButton(
              icon: Icon(
                Theme.of(context).brightness == Brightness.dark
                    ? Icons.light_mode
                    : Icons.dark_mode,
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.orange
                    : const Color(0xFF1A237E),
              ),
              onPressed: () {
                themeNotifier.value = Theme.of(context).brightness == Brightness.dark
                    ? ThemeMode.light
                    : ThemeMode.dark;
              },
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                setState(() {
                  _selectedIndex = 2; // Navigate to Profile tab
                });
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    _getInitials(widget.managerName),
                    style: const TextStyle(
                      fontSize: 18, // Slightly smaller to fit 2 letters if needed
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1A237E), // Navy Blue
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAttendanceCard() {
    return const AttendanceCard();
  }

  Widget _buildQuickLinkCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required Color iconColor,
  }) {
    return _HoverableCard(
      icon: icon,
      title: title,
      subtitle: subtitle,
      color: color,
      iconColor: iconColor,
      onTap: () async {
        if (title == 'Cafeteria') {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const CafeteriaScreen(
                initialShowDeskBooking: false,
              ),
            ),
          );
          if (result == 'profile') {
            setState(() {
              _selectedIndex = 2; // Navigate to Profile tab
            });
          }
        } else if (title == 'Parking') {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const ParkingScreen(),
            ),
          );
          if (result == 'profile') {
            setState(() {
              _selectedIndex = 2; // Navigate to Profile tab
            });
          }
        }
      },
    );
  }

  Widget _buildTeamOverview() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
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
           Text(
            'Team Overview',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white
                  : const Color(0xFF333333),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem('18', 'PRESENT', Colors.blue),
              _buildStatItem('3', 'ON LEAVE', Colors.red),
              _buildStatItem('2', 'PENDING', Colors.orange),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAnnouncedHolidays() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
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
           Text(
            'ANNOUNCED HOLIDAYS',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white
                  : const Color(0xFF1A237E), // Navy Blue
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columnSpacing: 20,
              horizontalMargin: 0,
              columns: const [
                DataColumn(label: Text('DATE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF8C8D90)))),
                DataColumn(label: Text('EVENT NAME', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF8C8D90)))),
                DataColumn(label: Text('DAY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF8C8D90)))),
                DataColumn(label: Text('CATEGORY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF8C8D90)))),
                DataColumn(label: Text('STATUS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF8C8D90)))),
              ],
              rows: [
                _buildHolidayRow('Jan 26, 2026', 'Republic Day', 'Monday', 'NATIONAL', 'COMPLETED', Colors.green),
                _buildHolidayRow('Feb 26, 2026', 'Maha Shivratri', 'Thursday', 'RELIGIOUS', 'UPCOMING', Colors.orange),
                _buildHolidayRow('Mar 14, 2026', 'Holi', 'Saturday', 'FESTIVAL', 'SCHEDULED', Colors.grey),
                _buildHolidayRow('Mar 29, 2026', 'Ram Navami', 'Sunday', 'RELIGIOUS', 'SCHEDULED', Colors.grey),
                _buildHolidayRow('Apr 10, 2026', 'Good Friday', 'Friday', 'RELIGIOUS', 'SCHEDULED', Colors.grey),
              ],
            ),
          ),
        ],
      ),
    );
  }

  DataRow _buildHolidayRow(String date, String name, String day, String category, String status, Color statusColor) {
    return DataRow(
      cells: [
        DataCell(Text(date, style: TextStyle(
            fontWeight: FontWeight.w500,
            color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black87
        ))),
        DataCell(Text(name, style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark ? Colors.blueAccent[100] : const Color(0xFF1A237E), // Navy Blue
            fontWeight: FontWeight.w500
        ))),
        DataCell(Text(day, style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black87
        ))),
        DataCell(
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.amber.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              category,
              style: const TextStyle(fontSize: 10, color: Colors.amber, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        DataCell(
          Text(
            status,
            style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  Widget _buildStatItem(String value, String label, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1A1A2E),
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: 24,
          height: 3,
          color: color,
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey[500],
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }
}

class _HoverableCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final Color iconColor;
  final VoidCallback onTap;

  const _HoverableCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.iconColor,
    required this.onTap,
  });

  @override
  State<_HoverableCard> createState() => _HoverableCardState();
}

class _HoverableCardState extends State<_HoverableCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          transform: _isHovered ? (Matrix4.identity()..scale(1.05)) : Matrix4.identity(),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: _isHovered ? 0.1 : 0.05),
                blurRadius: _isHovered ? 15 : 10,
                offset: _isHovered ? const Offset(0, 8) : const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: widget.color.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(widget.icon, color: widget.iconColor, size: 28),
              ),
              const SizedBox(height: 12),
              Text(
                widget.title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF333333),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                widget.subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
               const SizedBox(height: 8),
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                height: 3,
                width: _isHovered ? 40 : 0,
                decoration: BoxDecoration(
                  color: Colors.orange,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
