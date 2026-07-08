import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../../models/enums.dart';
import '../../../models/user.dart';

class AuthRepository {
  AuthRepository(this._api, this._storage);

  final ApiClient _api;
  final TokenStorage _storage;

  /// إرسال OTP للعميل (SPEC §2.1).
  Future<int> sendOtp(String phone) async {
    final Map<String, dynamic> data =
        await _api.post('/auth/send-otp', data: <String, dynamic>{'phone': phone}, auth: false);
    return (data['expiresIn'] as num?)?.toInt() ?? 600;
  }

  Future<AppUser> verifyOtp(String phone, String otp) async {
    final Map<String, dynamic> data = await _api.post(
      '/auth/verify-otp',
      data: <String, dynamic>{'phone': phone, 'otp': otp},
      auth: false,
    );
    return _persist(AuthResult.fromJson(data));
  }

  /// دخول الموظفين (بريد/رقم موظف + كلمة مرور).
  Future<AppUser> login(String identifier, String password) async {
    final Map<String, dynamic> data = await _api.post(
      '/auth/login',
      data: <String, dynamic>{'identifier': identifier, 'password': password},
      auth: false,
    );
    return _persist(AuthResult.fromJson(data));
  }

  /// [وضع التجربة فقط] يجلب رمز OTP الحالي لعرضه على الشاشة (DEMO_MODE + DEMO_OTP_ENABLED بالخادم).
  Future<String?> getDemoOtp(String phone) async {
    if (!AppConfig.demoMode) return null;
    try {
      final Map<String, dynamic> data = await _api.get('/auth/demo/otp', query: <String, dynamic>{'phone': phone});
      return data['otp'] as String?;
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() => _storage.clear();

  Future<AppUser> _persist(AuthResult result) async {
    await _storage.save(
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      role: result.user.role.api,
      userId: result.user.id,
    );
    return result.user;
  }
}
