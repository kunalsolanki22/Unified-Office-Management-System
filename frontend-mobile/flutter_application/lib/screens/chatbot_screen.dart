import 'package:flutter/material.dart';
import '../services/chatbot_service.dart';

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final ChatbotService _chatbotService = ChatbotService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  List<Map<String, dynamic>> _conversations = [];
  
  String? _sessionId;
  String? _userName;
  bool _isLoading = false;
  bool _isConnecting = true;
  bool _isLoadingHistory = false;
  String? _connectionError;

  static const Color navyColor = Color(0xFF1A367C);

  @override
  void initState() {
    super.initState();
    _handleAutoLogin();
  }

  Future<void> _handleAutoLogin() async {
    setState(() {
      _isConnecting = true;
      _connectionError = null;
    });

    try {
      final result = await _chatbotService.tokenLogin();
      if (result['success'] == true && result['session_id'] != null) {
        setState(() {
          _sessionId = result['session_id'];
          _userName = result['user_name'];
          _isConnecting = false;
        });
      } else {
        setState(() {
          _isConnecting = false;
          _connectionError = result['message'] ?? 'Connection to AI failed';
        });
      }
    } catch (e) {
      setState(() {
        _isConnecting = false;
        _connectionError = 'Cannot reach chatbot server';
      });
    }
  }

  Future<void> _fetchConversations() async {
    if (_sessionId == null) return;
    setState(() => _isLoadingHistory = true);
    
    try {
      final result = await _chatbotService.getConversations(_sessionId!);
      if (result['success'] == true) {
        setState(() {
          _conversations = List<Map<String, dynamic>>.from(result['conversations'] ?? []);
        });
      }
    } catch (e) {
      debugPrint('Error fetching history: $e');
    } finally {
      setState(() => _isLoadingHistory = false);
    }
  }

  Future<void> _handleNewChat() async {
    if (_sessionId == null || _isLoading) return;
    
    setState(() => _isLoading = true);
    try {
      final result = await _chatbotService.startNewChat(_sessionId!);
      if (result['success'] == true) {
        setState(() {
          _messages.clear();
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to start new chat')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadConversation(String conversationId) async {
    if (_sessionId == null || _isLoading) return;
    
    Navigator.pop(context); // Close drawer
    setState(() => _isLoading = true);
    
    try {
      final loadRes = await _chatbotService.loadConversation(_sessionId!, conversationId);
      if (loadRes['success'] == true) {
        final msgsRes = await _chatbotService.getConversationMessages(_sessionId!, conversationId);
        if (msgsRes['success'] == true) {
          setState(() {
            _messages.clear();
            final historyMsgs = List<Map<String, dynamic>>.from(msgsRes['messages'] ?? []);
            _messages.addAll(historyMsgs.map((m) => {
              'role': m['role'],
              'content': m['content'],
            }));
          });
          _scrollToBottom();
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to load conversation')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _sessionId == null || _isLoading) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _messageController.clear();
      _isLoading = true;
    });
    
    _scrollToBottom();

    try {
      final result = await _chatbotService.sendMessage(_sessionId!, text);
      if (result['success'] == true) {
        setState(() {
          _messages.add({'role': 'bot', 'content': result['message']});
          _isLoading = false;
        });
      } else {
        setState(() {
          _messages.add({'role': 'bot', 'content': 'Error: ${result['message']}'});
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _messages.add({'role': 'bot', 'content': 'Connection lost.'});
        _isLoading = false;
      });
    }
    
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      endDrawer: _buildHistoryDrawer(),
      body: SafeArea(
        child: Column(
          children: [
            // ─── Desktop-style Header ───
            _buildChatHeader(context),
            Expanded(
              child: _isConnecting
                  ? _buildConnectingState()
                  : _connectionError != null
                      ? _buildErrorState()
                      : _messages.isEmpty ? _buildEmptyState() : _buildChatList(),
            ),
            if (!_isConnecting && _connectionError == null && _messages.isNotEmpty)
              _buildInputArea(),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final hour = DateTime.now().hour;
    String greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      width: double.infinity,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '$greeting,\n${_userName != null ? _userName!.split(' ')[0] : 'there'}',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 32,
              height: 1.2,
              fontFamily: 'Georgia', // Approximation for serif
              color: navyColor,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'TASK AUTOMATION SUITE',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 2.0,
              color: navyColor.withOpacity(0.5),
            ),
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                TextField(
                  controller: _messageController,
                  maxLines: 3,
                  minLines: 1,
                  decoration: const InputDecoration(
                    hintText: 'Tell me what you need done...',
                    border: InputBorder.none,
                    hintStyle: TextStyle(color: Colors.grey, fontSize: 16),
                  ),
                  onSubmitted: (_) => _sendMessage(),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: const Row(
                        children: [
                          Text('CYGNET 2.5', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                          SizedBox(width: 4),
                          Icon(Icons.keyboard_arrow_down, size: 14, color: Colors.grey),
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: _sendMessage,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.arrow_forward, size: 18, color: Colors.grey),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            childAspectRatio: 3,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _buildServiceChip('Attendance', Icons.person_outline, 'I need to check my attendance for this week.'),
              _buildServiceChip('Desk', Icons.desktop_windows_outlined, 'I want to book a desk for tomorrow.'),
              _buildServiceChip('IT Support', Icons.build_outlined, 'I have an issue with my laptop and need IT support.'),
              _buildServiceChip('Cafeteria', Icons.restaurant_outlined, "What's on the cafeteria menu today?"),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildServiceChip(String label, IconData icon, String prompt) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _messageController.text = prompt;
        });
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.01),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: navyColor),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: navyColor,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatHeader(BuildContext outerContext) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1e3a8a), Color(0xFF1e40af)],
        ),
      ),
      child: Row(
        children: [
          // Back button (when navigated via push)
          if (Navigator.of(outerContext).canPop())
            GestureDetector(
              onTap: () => Navigator.of(outerContext).pop(),
              child: Container(
                width: 36,
                height: 36,
                margin: const EdgeInsets.only(right: 10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.chevron_left, color: Colors.white, size: 22),
              ),
            ),
          // Avatar
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(19),
            ),
            child: const Center(
              child: Text('🤖', style: TextStyle(fontSize: 20)),
            ),
          ),
          const SizedBox(width: 12),
          // Title + Status
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: const TextSpan(
                    children: [
                      TextSpan(
                        text: 'CYGNET',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                      TextSpan(
                        text: '.AI',
                        style: TextStyle(
                          color: Color(0xFFFFB012),
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _sessionId != null ? '● Online' : '○ Offline',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.75),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          // Action buttons
          if (_sessionId != null) ...[
            _buildHeaderIconBtn(Icons.add_rounded, 'New Chat', _handleNewChat),
            const SizedBox(width: 6),
            Builder(
              builder: (ctx) => _buildHeaderIconBtn(
                Icons.history_rounded,
                'History',
                () {
                  _fetchConversations();
                  Scaffold.of(ctx).openEndDrawer();
                },
              ),
            ),
            const SizedBox(width: 6),
          ],
          _buildHeaderIconBtn(Icons.refresh_rounded, 'Refresh', _handleAutoLogin),
        ],
      ),
    );
  }

  Widget _buildHeaderIconBtn(IconData icon, String tooltip, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: tooltip,
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.white, size: 16),
        ),
      ),
    );
  }


  Widget _buildToolbarButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: const Color(0xFFF0F4FF),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: navyColor.withOpacity(0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: navyColor),
              const SizedBox(width: 6),
              Text(
                label,
                style: const TextStyle(
                  color: navyColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryDrawer() {
    return Drawer(
      child: Column(
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(color: navyColor),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   const Icon(Icons.history, color: Colors.white, size: 40),
                   const SizedBox(height: 12),
                   const Text(
                    'Chat History',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    '${_conversations.length} total chats',
                    style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoadingHistory 
              ? const Center(child: CircularProgressIndicator(color: navyColor))
              : _conversations.isEmpty
                ? const Center(child: Text('No previous chats found.', style: TextStyle(color: Colors.grey)))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _conversations.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final conv = _conversations[index];
                      return ListTile(
                        leading: const CircleAvatar(
                          backgroundColor: Color(0xFFEFF6FF),
                          child: Icon(Icons.chat_outlined, color: navyColor, size: 18),
                        ),
                        title: Text(
                          conv['title'] ?? 'New Chat',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                        subtitle: Text(
                          conv['created_at'] != null 
                            ? conv['created_at'].toString().split('T')[0]
                            : 'Unknown date',
                          style: const TextStyle(fontSize: 11),
                        ),
                        onTap: () => _loadConversation(conv['id']),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildConnectingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: navyColor),
          SizedBox(height: 16),
          Text('Connecting to AI Assistant...', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.redAccent),
            const SizedBox(height: 16),
            Text(
              _connectionError ?? 'Connection Error',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _handleAutoLogin,
              style: ElevatedButton.styleFrom(
                backgroundColor: navyColor,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              ),
              child: const Text('Retry Connection', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatList() {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: _messages.length + (_isLoading ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _messages.length) {
          return _buildTypingIndicator();
        }
        final msg = _messages[index];
        final isBot = msg['role'] == 'bot';
        return _buildMessageBubble(msg['content'], isBot);
      },
    );
  }

  Widget _buildMessageBubble(String content, bool isBot) {
    return Align(
      alignment: isBot ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isBot ? Colors.white : navyColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isBot ? 4 : 16),
            bottomRight: Radius.circular(isBot ? 16 : 4),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 5,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Text(
          content,
          style: TextStyle(
            color: isBot ? Colors.black87 : Colors.white,
            fontSize: 14,
            height: 1.4,
          ),
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(width: 4, height: 4, child: CircularProgressIndicator(strokeWidth: 2)),
            SizedBox(width: 8),
            Text('AI is thinking...', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 5,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: InputDecoration(
                hintText: 'Type your message...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey[100],
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            backgroundColor: navyColor,
            child: IconButton(
              icon: const Icon(Icons.send, color: Colors.white, size: 18),
              onPressed: _sendMessage,
            ),
          ),
        ],
      ),
    );
  }
}
