import 'package:flutter/material.dart';

/// Centralized snackbar helper for consistent notification behavior.
/// 
/// All snackbars:
/// - Display for 1.5 seconds (1500ms)
/// - Replace any existing snackbar immediately
/// 
/// Usage:
///   SnackbarHelper.showSuccess(context, 'Operation successful');
///   SnackbarHelper.showError(context, 'Something went wrong');
///   SnackbarHelper.showWarning(context, 'Please select an item');
///   SnackbarHelper.showInfo(context, 'Loading...');
class SnackbarHelper {
  static const Duration _defaultDuration = Duration(milliseconds: 1500);

  /// Shows a success snackbar (green background)
  static void showSuccess(BuildContext context, String message) {
    _show(context, message, Colors.green);
  }

  /// Shows an error snackbar (red background)
  static void showError(BuildContext context, String message) {
    _show(context, message, Colors.red);
  }

  /// Shows a warning snackbar (orange background)
  static void showWarning(BuildContext context, String message) {
    _show(context, message, Colors.orange);
  }

  /// Shows an info snackbar (blue background)
  static void showInfo(BuildContext context, String message) {
    _show(context, message, Colors.blue);
  }

  /// Shows a custom snackbar with specified color
  static void show(BuildContext context, String message, {Color? backgroundColor}) {
    _show(context, message, backgroundColor ?? Colors.grey[800]!);
  }

  /// Internal method that handles hiding current snackbar and showing new one
  static void _show(BuildContext context, String message, Color backgroundColor) {
    if (!context.mounted) return;
    
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: backgroundColor,
          duration: _defaultDuration,
        ),
      );
  }
}
