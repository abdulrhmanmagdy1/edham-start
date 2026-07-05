import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../../models/enums.dart';
import '../../../models/user.dart';
import '../data/auth_repository.dart';

/// يُحقن عند الإقلاع (ProviderScope overrides).
final tokenStorageProvider = Provider<TokenStorage>(
  (Ref ref) => throw UnimplementedError('override at startup'),
);

final apiClientProvider = Provider<ApiClient>(
  (Ref ref) => ApiClient(ref.watch(tokenStorageProvider)),
);

final authRepositoryProvider = Provider<AuthRepository>(
  (Ref ref) => AuthRepository(ref.watch(apiClientProvider), ref.watch(tokenStorageProvider)),
);

/// حالة المصادقة.
class AuthState {
  const AuthState({this.user, this.loading = false});

  final AppUser? user;
  final bool loading;

  bool get isLoggedIn => user != null;
  UserRole? get role => user?.role;

  AuthState copyWith({AppUser? user, bool? loading, bool clearUser = false}) => AuthState(
        user: clearUser ? null : (user ?? this.user),
        loading: loading ?? this.loading,
      );
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repo, this._storage) : super(const AuthState()) {
    _restore();
  }

  final AuthRepository _repo;
  final TokenStorage _storage;

  void _restore() {
    // جلسة سابقة: نعرف الدور من التخزين (بيانات المستخدم الكاملة تُجلب عند الحاجة).
    final String? role = _storage.role;
    final String? userId = _storage.userId;
    if (role != null && userId != null) {
      state = AuthState(
        user: AppUser(
          id: userId,
          fullName: '',
          phone: '',
          role: UserRoleX.fromApi(role),
        ),
      );
    }
  }

  Future<int> sendOtp(String phone) => _repo.sendOtp(phone);

  Future<void> verifyOtp(String phone, String otp) async {
    state = state.copyWith(loading: true);
    try {
      final AppUser user = await _repo.verifyOtp(phone, otp);
      state = AuthState(user: user);
    } finally {
      if (mounted && state.loading) state = state.copyWith(loading: false);
    }
  }

  Future<void> login(String identifier, String password) async {
    state = state.copyWith(loading: true);
    try {
      final AppUser user = await _repo.login(identifier, password);
      state = AuthState(user: user);
    } finally {
      if (mounted && state.loading) state = state.copyWith(loading: false);
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState();
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>(
  (Ref ref) => AuthController(ref.watch(authRepositoryProvider), ref.watch(tokenStorageProvider)),
);
