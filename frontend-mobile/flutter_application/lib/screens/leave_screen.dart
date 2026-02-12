import 'package:flutter/material.dart';

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  DateTime _focusedDay = DateTime.now();
  // DateTime? _selectedDay;
  final _reasonController = TextEditingController();
  final _dateController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _reasonController.dispose();
    _dateController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
            const Text(
              'LEAVE REQUEST',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A237E),
                letterSpacing: 1.0,
              ),
            ),
            const SizedBox(height: 16),
            _buildOverviewSection(),
            const SizedBox(height: 24),
            _buildApplyForm(),
            const SizedBox(height: 80), // Bottom padding
          ],
        ),
      ),
    );
  }

  Widget _buildOverviewSection() {
    return Container(
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
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Calendar
          CalendarDatePicker(
            initialDate: _focusedDay.isBefore(DateTime.now()) ? DateTime.now() : _focusedDay,
            firstDate: DateTime.now(),
            lastDate: DateTime(2030),
            onDateChanged: (date) {
              setState(() {
                _focusedDay = date;
                // _selectedDay = date;
                // Auto-fill the date field when a date is selected on calendar
                _dateController.text = "${date.day} / ${date.month} / ${date.year}";
              });
            },
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStat('Days Present: 18', Colors.grey[700]!),
              _buildStat('Pending Logs: 0', Colors.grey[700]!),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStat(String text, Color color) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: color,
      ),
    );
  }

  Widget _buildApplyForm() {
    return Container(
      padding: const EdgeInsets.all(20),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'LEAVE DATE',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _dateController,
            readOnly: true,
            decoration: InputDecoration(
              hintText: 'dd / mm / yyyy',
              suffixIcon: const Icon(Icons.calendar_today, size: 20),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[300]!),
              ),
              filled: true,
              fillColor: Colors.grey[50],
            ),
            onTap: () async {
              final DateTime? picked = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime.now(),
                lastDate: DateTime(2030),
              );
              if (picked != null) {
                setState(() {
                  _dateController.text = "${picked.day} / ${picked.month} / ${picked.year}";
                });
              }
            },
          ),
          const SizedBox(height: 16),
          const Text(
            'REASON',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _reasonController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Reason for leave...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[300]!),
              ),
              filled: true,
              fillColor: Colors.grey[50],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context)
                  ..hideCurrentSnackBar()
                  ..showSnackBar(
                    const SnackBar(
                      content: Text('Leave Request Sent Successfully'),
                      backgroundColor: Colors.green,
                      duration: Duration(milliseconds: 1500),
                    ),
                  );
                setState(() {
                  _dateController.clear();
                  _reasonController.clear();
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A237E), // Assuming this is the theme color
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'CONFIRM REQUEST',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
