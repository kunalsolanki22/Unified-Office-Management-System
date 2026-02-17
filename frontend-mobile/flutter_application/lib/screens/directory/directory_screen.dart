import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/user_service.dart';
import '../../services/auth_service.dart';
import 'package:flutter/services.dart';

const Color kNavy = Color(0xFF1A367C);
const Color kBg = Color(0xFFF8FAFC);
const Color kCard = Colors.white;
const Color kSubtitle = Color(0xFF8E99A7);
const Color kInfoIcon = Color(0xFF2563EB);
const double kCardRadius = 20;

class DirectoryScreen extends StatefulWidget {
  const DirectoryScreen({super.key});

  @override
  State<DirectoryScreen> createState() => _DirectoryScreenState();
}

class _DirectoryScreenState extends State<DirectoryScreen> {
  String _selectedRole = 'All';
  List<String> _allRoles = ['All'];
  final UserService _userService = UserService();
  final AuthService _authService = AuthService();
  List<dynamic> _users = [];
  bool _loading = true;
  String? _currentUserId;
  String _search = '';
  Timer? _autoRefreshTimer;

  @override
  void initState() {
    super.initState();
    _initAndFetch();
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      _fetchUsers();
    });
  }

  Future<void> _initAndFetch() async {
    final profile = await _authService.getUserProfile();
    setState(() {
      _currentUserId = profile?['id']?.toString();
    });
    await _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    setState(() => _loading = true);

    final res = await _userService.getUsers(
      page: 1,
      pageSize: 1000,
      search: _search,
    );

    if (!mounted) return;

    if (res['success'] == true) {
      final List<dynamic> data = res['data'] ?? [];

      final filtered =
          data.where((u) => u['id']?.toString() != _currentUserId).toList();

      final roles = filtered
          .map((u) => (u['role'] ?? '').toString())
          .where((r) => r.isNotEmpty)
          .toSet()
          .toList()
        ..sort();

      setState(() {
        _allRoles = ['All', ...roles];
        _users = filtered;
        _loading = false;
      });
    } else {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  List<dynamic> _filteredUsers() {
    if (_selectedRole == 'All') return _users;
    return _users
        .where((u) => (u['role'] ?? '').toString() == _selectedRole)
        .toList();
  }

  Widget _buildDirectoryCard(dynamic user) {
    final name =
        '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}'.trim();
    final email = user['email'] ?? '';
    final role = user['role']?.toString() ?? '';
    final team = user['team']?.toString() ?? '';

    String initials = '';
    if (name.isNotEmpty) {
      final parts = name.split(' ');
      initials =
          parts.map((p) => p.isNotEmpty ? p[0] : '').take(2).join().toUpperCase();
    }

    Color avatarColor = kNavy;
    if (role.toLowerCase().contains('manager')) avatarColor = Colors.amber[700]!;
    if (role.toLowerCase().contains('director')) avatarColor = Colors.green[700]!;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(kCardRadius),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        leading: CircleAvatar(
          backgroundColor: avatarColor,
          child: Text(
            initials,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          radius: 26,
        ),
        title: Text(
          name,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: kNavy,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (role.isNotEmpty)
              Text(role, style: const TextStyle(fontSize: 13, color: kSubtitle)),
            if (team.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: 6),
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: kNavy.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  team.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: kNavy,
                    letterSpacing: 1,
                  ),
                ),
              ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.info_outline, color: kInfoIcon, size: 28),
          onPressed: () => _showUserInfoBottomSheet(user),
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value,
      {bool copyable = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: kBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: kNavy, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: SelectableText(value,
                style: const TextStyle(fontSize: 15, color: kNavy)),
          ),
          if (copyable)
            IconButton(
              icon: const Icon(Icons.copy, size: 18),
              onPressed: value.isNotEmpty
                  ? () {
                      Clipboard.setData(ClipboardData(text: value));
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('$label copied!'),
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    }
                  : null,
            ),
        ],
      ),
    );
  }

  void _showUserInfoBottomSheet(dynamic user) {
    final name =
        '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}'.trim();
    final email = user['email'] ?? '';
    final role = user['role']?.toString() ?? '';
    final team = user['team']?.toString() ?? '';
    final desk = user['desk_label']?.toString() ?? '';

    String initials = '';
    if (name.isNotEmpty) {
      final parts = name.split(' ');
      initials =
          parts.map((p) => p.isNotEmpty ? p[0] : '').take(2).join().toUpperCase();
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            CircleAvatar(
              backgroundColor: kNavy,
              radius: 38,
              child: Text(
                initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 28,
                ),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              name,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 22,
                color: kNavy,
              ),
            ),
            if (role.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  role,
                  style: const TextStyle(
                    fontSize: 14,
                    color: kSubtitle,
                    letterSpacing: 1,
                  ),
                ),
              ),
            const SizedBox(height: 18),
            if (team.isNotEmpty) _infoRow(Icons.groups, 'Team', team),
            if (email.isNotEmpty)
              _infoRow(Icons.email, 'Email', email, copyable: true),
            if (desk.isNotEmpty) _infoRow(Icons.chair, 'Desk', desk),
            const SizedBox(height: 18),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterButton() {
    return PopupMenuButton<String>(
      tooltip: 'Filter by role',
      offset: const Offset(0, 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: Colors.white,
      elevation: 4,
      onSelected: (role) {
        setState(() {
          _selectedRole = role;
        });
      },
      itemBuilder: (context) => _allRoles
          .map(
            (role) => PopupMenuItem<String>(
              value: role,
              child: Text(role,
                  style: const TextStyle(fontWeight: FontWeight.w500)),
            ),
          )
          .toList(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: kNavy.withOpacity(0.12)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.filter_list, color: kNavy, size: 20),
            SizedBox(width: 4),
            Icon(Icons.arrow_drop_down, color: kNavy, size: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: kNavy),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Directory',
          style: TextStyle(color: kNavy, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchUsers,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: TextField(
                        decoration: InputDecoration(
                          prefixIcon:
                              const Icon(Icons.search, color: kNavy),
                          hintText: 'Search name, role, or team...',
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(
                              vertical: 0, horizontal: 16),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        style:
                            const TextStyle(fontSize: 15, color: kNavy),
                        onChanged: (v) {
                          _search = v;
                          Future.delayed(const Duration(milliseconds: 300),
                              () {
                            if (v == _search) _fetchUsers();
                          });
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(height: 44, child: _buildFilterButton()),
                ],
              ),
            ),
            if (_loading)
              const Expanded(
                child: Center(
                  child: CircularProgressIndicator(color: kNavy),
                ),
              ),
            if (!_loading)
              Expanded(
                child: _filteredUsers().isEmpty
                    ? const Center(
                        child: Text('No users found',
                            style: TextStyle(color: kSubtitle)),
                      )
                    : ListView.builder(
                        itemCount: _filteredUsers().length,
                        itemBuilder: (context, i) =>
                            _buildDirectoryCard(_filteredUsers()[i]),
                      ),
              ),
          ],
        ),
      ),
    );
  }
}
