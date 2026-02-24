import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class RealTimeService {
  // Use ws://10.0.2.2:8000/ws for Android emulator
  // Use ws://127.0.0.1:8000/ws for Linux/Web
  static const String wsUrl = 'ws://127.0.0.1:8000/ws';
  
  static final RealTimeService _instance = RealTimeService._internal();
  factory RealTimeService() => _instance;
  RealTimeService._internal();

  WebSocketChannel? _channel;
  final _controller = StreamController<Map<String, dynamic>>.broadcast();
  Timer? _reconnectTimer;
  bool _isDisposed = false;

  Stream<Map<String, dynamic>> get stream => _controller.stream;

  void connect() {
    if (_isDisposed) return;
    
    debugPrint('Connecting to real-time updates WebSocket: $wsUrl');
    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      
      _channel!.stream.listen(
        (message) {
          try {
            final data = json.decode(message);
            debugPrint('Real-time update received: $data');
            _controller.add(data);
          } catch (e) {
            debugPrint('Error decoding WS message: $e');
          }
        },
        onDone: () {
          debugPrint('WebSocket closed. Reconnecting...');
          _reconnect();
        },
        onError: (error) {
          debugPrint('WebSocket error: $error. Reconnecting...');
          _reconnect();
        },
      );
    } catch (e) {
      debugPrint('WebSocket connection failed: $e. Reconnecting...');
      _reconnect();
    }
  }

  void _reconnect() {
    if (_isDisposed) return;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () => connect());
  }

  void dispose() {
    _isDisposed = true;
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _controller.close();
  }
}
