import 'package:hive_flutter/hive_flutter.dart';

/// تخزين التوكنات محلياً عبر Hive (Offline-first).
class TokenStorage {
  TokenStorage(this._box);

  final Box<String> _box;
  static const String _access = 'accessToken';
  static const String _refresh = 'refreshToken';
  static const String _role = 'role';
  static const String _userId = 'userId';

  static Future<TokenStorage> open() async {
    final Box<String> box = await Hive.openBox<String>('auth');
    return TokenStorage(box);
  }

  String? get accessToken => _box.get(_access);
  String? get refreshToken => _box.get(_refresh);
  String? get role => _box.get(_role);
  String? get userId => _box.get(_userId);
  bool get isLoggedIn => accessToken != null;

  Future<void> save({
    required String accessToken,
    required String refreshToken,
    required String role,
    required String userId,
  }) async {
    await _box.putAll(<String, String>{
      _access: accessToken,
      _refresh: refreshToken,
      _role: role,
      _userId: userId,
    });
  }

  Future<void> updateAccessToken(String accessToken) => _box.put(_access, accessToken);

  Future<void> clear() => _box.clear();
}
