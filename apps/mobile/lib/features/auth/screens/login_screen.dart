import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/enums.dart';
import '../providers/auth_providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  UserRole _role = UserRole.customer;
  bool _otpSent = false;
  bool _busy = false;
  String? _demoOtp; // رمز التجربة يُعرض على الشاشة في وضع العرض

  final TextEditingController _phone = TextEditingController();
  final TextEditingController _otp = TextEditingController();
  final TextEditingController _identifier = TextEditingController();
  final TextEditingController _password = TextEditingController();

  @override
  void dispose() {
    _phone.dispose();
    _otp.dispose();
    _identifier.dispose();
    _password.dispose();
    super.dispose();
  }

  bool get _isCustomer => _role == UserRole.customer;

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _guard(Future<void> Function() action) async {
    setState(() => _busy = true);
    try {
      await action();
    } on ApiException catch (e) {
      _snack(e.message);
    } catch (_) {
      _snack('حدث خطأ غير متوقع');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _sendOtp() => _guard(() async {
        final String phone = '+966${_phone.text.trim()}';
        await ref.read(authControllerProvider.notifier).sendOtp(phone);
        // وضع التجربة: اجلب الرمز واعرضه على الشاشة
        final String? demo = await ref.read(authRepositoryProvider).getDemoOtp(phone);
        if (mounted) {
          setState(() {
            _otpSent = true;
            _demoOtp = demo;
          });
        }
        _snack('تم إرسال رمز التحقق');
      });

  Future<void> _verifyOtp() => _guard(() async {
        final String phone = '+966${_phone.text.trim()}';
        await ref.read(authControllerProvider.notifier).verifyOtp(phone, _otp.text.trim());
      });

  Future<void> _login() => _guard(() async {
        await ref
            .read(authControllerProvider.notifier)
            .login(_identifier.text.trim(), _password.text);
      });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                const SizedBox(height: 24),
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Image.asset(
                    'assets/logo.png',
                    width: 120,
                    height: 120,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'إدهام للوجستيات',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: EdhamColors.black),
                ),
                const SizedBox(height: 4),
                const Text(
                  'سجّل الدخول للمتابعة',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: EdhamColors.textMuted),
                ),
                const SizedBox(height: 28),
                _RoleSelector(
                  selected: _role,
                  onChanged: (UserRole r) => setState(() {
                    _role = r;
                    _otpSent = false;
                  }),
                ),
                const SizedBox(height: 20),
                if (_isCustomer) ..._customerFields() else ..._employeeFields(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _customerFields() => <Widget>[
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          enabled: !_otpSent,
          decoration: const InputDecoration(
            labelText: 'رقم الجوال',
            prefixText: '+966 ',
            hintText: '5XXXXXXXX',
          ),
        ),
        if (_otpSent) ...<Widget>[
          const SizedBox(height: 12),
          TextField(
            controller: _otp,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'رمز التحقق (6 أرقام)'),
          ),
          if (AppConfig.demoMode && _demoOtp != null) ...<Widget>[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'رمز التجربة: $_demoOtp',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF92400E),
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  letterSpacing: 2,
                ),
              ),
            ),
          ],
        ],
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _busy ? null : (_otpSent ? _verifyOtp : _sendOtp),
          child: _busy
              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Text(_otpSent ? 'تحقّق ودخول' : 'إرسال رمز التحقق'),
        ),
        if (_otpSent)
          TextButton(
            onPressed: _busy ? null : () => setState(() => _otpSent = false),
            child: const Text('تغيير الرقم', style: TextStyle(color: EdhamColors.textMuted)),
          ),
      ];

  List<Widget> _employeeFields() => <Widget>[
        TextField(
          controller: _identifier,
          decoration: const InputDecoration(labelText: 'البريد الإلكتروني أو رقم الموظف'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _password,
          obscureText: true,
          decoration: const InputDecoration(labelText: 'كلمة المرور'),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _busy ? null : _login,
          child: _busy
              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('دخول'),
        ),
      ];
}

class _RoleSelector extends StatelessWidget {
  const _RoleSelector({required this.selected, required this.onChanged});

  final UserRole selected;
  final ValueChanged<UserRole> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.center,
      children: UserRole.values.map((UserRole r) {
        final bool active = r == selected;
        return ChoiceChip(
          label: Text(r.arabic),
          selected: active,
          onSelected: (_) => onChanged(r),
          selectedColor: EdhamColors.black,
          labelStyle: TextStyle(color: active ? Colors.white : EdhamColors.black),
          backgroundColor: EdhamColors.surface,
        );
      }).toList(),
    );
  }
}
