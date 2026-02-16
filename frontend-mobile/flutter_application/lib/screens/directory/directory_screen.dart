import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/user_service.dart';
import '../../services/auth_service.dart';

class DirectoryScreen extends StatefulWidget {
  const DirectoryScreen({super.key});

  @override
  State<DirectoryScreen> createState() => _DirectoryScreenState();
}

class _DirectoryScreenState extends State<DirectoryScreen> {
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
    final res = await _userService.getUsers(page: 1, pageSize: 1000, search: _search);
    if (res['success'] == true) {
      final List<dynamic> data = res['data'] ?? [];
      // Remove current user from list
      final filtered = data.where((u) => u['id']?.toString() != _currentUserId).toList();
      setState(() {
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

  Widget _buildListTile(dynamic user) {
    final name = '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}'.trim();
    final email = user['email'] ?? '';
    final role = user['role']?.toString() ?? '';

    String initials = '';
    if (name.isNotEmpty) {
      final parts = name.split(' ');
      initials = parts.map((p) => p.isNotEmpty ? p[0] : '').take(2).join().toUpperCase();
    }

    return ListTile(
      leading: CircleAvatar(child: Text(initials)),
      title: Text(name.isNotEmpty ? name : email),
      subtitle: Text('$role • $email'),
      onTap: () {},
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Company Directory'),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchUsers,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: TextField(
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search),
                  hintText: 'Search by name, email or role',
                  border: OutlineInputBorder(),
                ),
                onChanged: (v) {
                  _search = v;
                  // debounce briefly
                  Future.delayed(const Duration(milliseconds: 300), () {
                    if (v == _search) _fetchUsers();
                  });
                },
              ),
            ),
            if (_loading) const Expanded(child: Center(child: CircularProgressIndicator())),
            if (!_loading)
              Expanded(
                child: _users.isEmpty
                    ? const Center(child: Text('No users found'))
                    : ListView.separated(
                        itemCount: _users.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) => _buildListTile(_users[index]),
                      ),
              ),
          ],
        ),
      ),
    );
  }
}
