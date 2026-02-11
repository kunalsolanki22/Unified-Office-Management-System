import 'package:flutter/material.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  bool _isEmailVerified = false;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1A1A2E)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Scrollbar(
          controller: _scrollController,
          thumbVisibility: true,
          trackVisibility: true,
          interactive: true,
          thickness: 8.0,
          radius: const Radius.circular(8),
          child: Center(
            child: SingleChildScrollView(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLogo(),
                  const SizedBox(height: 32),
                  Text(
                    _isEmailVerified ? 'Reset Password' : 'Forgot Password',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1A1A2E),
                    ),
                  ),
                const SizedBox(height: 8),
                Text(
                  _isEmailVerified 
                    ? 'Enter your new password below.' 
                    : 'Enter your email address to verify your account.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 32),
                if (!_isEmailVerified) _buildEmailStep(),
                if (_isEmailVerified) _buildResetStep(),
              ],
            ),
          ),
        ),
        ), // Scrollbar
      ), // SafeArea
    ); // Scaffold
  }

  Widget _buildLogo() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: const Icon(
        Icons.lock_reset,
        size: 40,
        color: Color(0xFF4A6CF7),
      ),
    );
  }

  Widget _buildEmailStep() {
    return Column(
      children: [
        _buildTextField(
          controller: _emailController,
          label: 'Email',
          hint: 'name@cygnet.one',
          icon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _verifyEmail,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4A6CF7),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              elevation: 0,
            ),
            child: const Text(
              'Verify Email',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildResetStep() {
    return Column(
      children: [
        _buildTextField(
          controller: _newPasswordController,
          label: 'New Password',
          hint: '••••••••••••',
          icon: Icons.lock_outline,
          isPassword: true,
          showPassword: !_obscureNewPassword,
          onTogglePassword: () {
            setState(() {
              _obscureNewPassword = !_obscureNewPassword;
            });
          },
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _confirmPasswordController,
          label: 'Confirm Password',
          hint: '••••••••••••',
          icon: Icons.lock_outline,
          isPassword: true,
          showPassword: !_obscureConfirmPassword,
          onTogglePassword: () {
            setState(() {
              _obscureConfirmPassword = !_obscureConfirmPassword;
            });
          },
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _resetPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4A6CF7),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              elevation: 0,
            ),
            child: const Text(
              'Reset Password',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    bool isPassword = false,
    bool showPassword = false,
    VoidCallback? onTogglePassword,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF333333),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: isPassword && !showPassword,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: Colors.grey[400],
              fontSize: 14,
            ),
            prefixIcon: Icon(icon, color: Colors.grey[400], size: 20),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(
                      showPassword ? Icons.visibility : Icons.visibility_off,
                      color: Colors.grey[500],
                      size: 20,
                    ),
                    onPressed: onTogglePassword,
                  )
                : null,
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF4A6CF7)),
            ),
          ),
        ),
      ],
    );
  }

  void _verifyEmail() {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _showSnackBar('Please enter your email', Colors.red);
      return;
    }

    // Mock Business Logic: Check if email contains 'cygnet'
    // In real app, this would call an API
    if (email.toLowerCase().contains('cygnet')) {
       // Mock loading
       Future.delayed(const Duration(seconds: 1), () {
         if (mounted) {
            setState(() {
              _isEmailVerified = true;
            });
            _showSnackBar('Email verified successfully', Colors.green);
         }
       });
    } else {
      _showSnackBar('Email not found in our records', Colors.red);
    }
  }

  void _resetPassword() {
    final newPass = _newPasswordController.text;
    final confirmPass = _confirmPasswordController.text;

    if (newPass.isEmpty || confirmPass.isEmpty) {
      _showSnackBar('Please fill in all fields', Colors.red);
      return;
    }

    if (newPass != confirmPass) {
      _showSnackBar('Passwords do not match', Colors.red);
      return;
    }

    if (newPass.length < 6) {
      _showSnackBar('Password must be at least 6 characters', Colors.red);
      return;
    }

    // Mock Success
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        _showSnackBar('Password reset successfully! Please login.', Colors.green);
        Navigator.pop(context); // Go back to login
      }
    });
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
