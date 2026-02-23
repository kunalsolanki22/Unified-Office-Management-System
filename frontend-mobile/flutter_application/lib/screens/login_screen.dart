import 'package:flutter/material.dart';
import 'manager/manager_dashboard.dart';
import 'change_password_screen.dart';
import 'employee/employee_dashboard.dart';
import '../services/auth_service.dart';
import '../utils/snackbar_helper.dart';


class LoginPage extends StatefulWidget {
  final VoidCallback? onToggleTheme;
  final bool? isDark;
  const LoginPage({super.key, this.onToggleTheme, this.isDark});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  bool _rememberMe = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildLogo(),
                const SizedBox(height: 48),
                _buildEmailField(),
                const SizedBox(height: 20),
                _buildPasswordField(),
                const SizedBox(height: 16),
                _buildRememberMe(),
                const SizedBox(height: 24),
                _buildLoginButton(),
                const SizedBox(height: 16),
                const SizedBox(height: 48),
                _buildFooter(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.asset(
            'assets/images/logo.jpeg',
            width: 48,
            height: 48,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                width: 48,
                height: 48,
                color: Colors.grey,
                child: const Icon(Icons.business),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Flexible(
          child: RichText(
            textAlign: TextAlign.center,
            text: const TextSpan(
              children: [
                TextSpan(
                  text: 'Unified',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                  ),
                ),
                TextSpan(
                  text: '.Office',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w400,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmailField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Email',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF333333),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            hintText: 'name@cygnet.one',
            hintStyle: TextStyle(
              color: Colors.grey[400],
              fontSize: 14,
            ),
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
              borderSide: const BorderSide(color: Color(0xFF1A367C)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Password',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF333333),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _passwordController,
          obscureText: _obscurePassword,
          decoration: InputDecoration(
            hintText: '••••••••••••',
            hintStyle: TextStyle(
              color: Colors.grey[400],
              fontSize: 14,
            ),
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
              borderSide: const BorderSide(color: Color(0xFF1A367C)),
            ),
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_off : Icons.visibility,
                color: Colors.grey[500],
                size: 20,
              ),
              onPressed: () {
                setState(() {
                  _obscurePassword = !_obscurePassword;
                });
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRememberMe() {
    return Row(
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: _rememberMe,
            onChanged: (value) {
              setState(() {
                _rememberMe = value ?? false;
              });
            },
            activeColor: const Color(0xFF1A367C),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
        const SizedBox(width: 8),
        const Expanded(
          child: Text(
            'Remember Me',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF333333),
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildLoginButton() {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1A367C),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          elevation: 0,
        ),
        child: _isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : const Text(
                'Login',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }

  Widget _buildChangePassword() {
    return Align(
      alignment: Alignment.centerRight,
      child: TextButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const ChangePasswordScreen()),
          );
        },
        style: TextButton.styleFrom(
          padding: EdgeInsets.zero,
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        child: const Text(
          'Change Password',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF1A367C),
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return const Text(
      '© Cygnet Infotech Pvt. Ltd.',
      style: TextStyle(
        fontSize: 12,
        color: Color(0xFF999999),
      ),
    );
  }

  // Email validation: simple check for @ and .
  String? _validateEmail(String email) {
    if (email.isEmpty) {
      return 'Email is required';
    }
    if (!email.contains('@') || !email.contains('.')) {
      return 'Invalid email format';
    }
    return null;
  }

  // Password validation: just required check for now to allow easier testing
  String? _validatePassword(String password) {
    if (password.isEmpty) {
      return 'Password is required';
    }
    return null;
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    // Validate email
    final emailError = _validateEmail(email);
    if (emailError != null) {
      _showErrorStackBar(emailError);
      return;
    }

    // Validate password
    final passwordError = _validatePassword(password);
    if (passwordError != null) {
      _showErrorStackBar(passwordError);
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final result = await _authService.login(email, password);

    setState(() {
      _isLoading = false;
    });

      if (result['success']) {
        // Login successful, get user role
        final userRoleData = await _authService.getCurrentUserRole();
        
        if (userRoleData != null) {
          // Normalize to uppercase to handle case differences
          final role = (userRoleData['role'] ?? 'EMPLOYEE').toString().toUpperCase(); 
          
          // Try to fetch full profile for dynamic name
          String name = userRoleData['sub'] ?? 'User';
          Map<String, dynamic>? profile; // Declare outside try block
          try {
            profile = await _authService.getUserProfile();
            if (profile != null && profile['full_name'] != null) {
              name = profile['full_name'];
            }
          } catch (e) {
            print('Failed to fetch profile: $e');
            // Fallback to name from token
          }
          
          _showSuccessSnackBar('Login Successful');
  
          if (context.mounted) {
             if (role == 'MANAGER' || role == 'ADMIN' || role == 'SUPER_ADMIN') {
              // Construct a profile map if the fetch failed or was partial
              final Map<String, dynamic> finalProfile = profile ?? {
                'full_name': name,
                'role': role,
                'email': userRoleData['sub'] ?? '',
                // Add checks to prevent nulls
              };
              // Ensure full_name is present if it wasn't in the fetch
              if (finalProfile['full_name'] == null) finalProfile['full_name'] = name;

              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) => ManagerDashboard(
                    userProfile: finalProfile,
                    onToggleTheme: widget.onToggleTheme,
                  ),
                ),
              );
            } else {
              // TEAM_LEAD, EMPLOYEE
               Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) => EmployeeDashboard(
                    userName: name,
                    onToggleTheme: widget.onToggleTheme,
                    isDark: widget.isDark,
                  ),
                ),
              );
            }
          }
        } else {
          _showErrorStackBar('Failed to retrieve user role');
        }
      } else {
      _showErrorStackBar(result['message']);
    }
  }

  void _showErrorStackBar(String message) {
    SnackbarHelper.showError(context, message);
  }

  void _showSuccessSnackBar(String message) {
    SnackbarHelper.showSuccess(context, message);
  }
}
