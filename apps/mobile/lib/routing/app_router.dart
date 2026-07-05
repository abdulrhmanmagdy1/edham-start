import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/providers/auth_providers.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/customer/screens/create_order_screen.dart';
import '../features/customer/screens/customer_home_screen.dart';
import '../features/customer/screens/order_detail_screen.dart';
import '../features/shared/role_placeholder_screen.dart';
import '../models/enums.dart';

String roleHome(UserRole role) => switch (role) {
      UserRole.customer => '/customer',
      UserRole.driver => '/driver',
      UserRole.supervisor => '/supervisor',
      UserRole.accountant => '/accountant',
      UserRole.workshop => '/workshop',
    };

final routerProvider = Provider<GoRouter>((Ref ref) {
  final ValueNotifier<int> refresh = ValueNotifier<int>(0);
  ref.listen(authControllerProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: refresh,
    redirect: (_, GoRouterState state) {
      final AuthState auth = ref.read(authControllerProvider);
      final bool onLogin = state.matchedLocation == '/login';
      if (!auth.isLoggedIn) return onLogin ? null : '/login';
      if (onLogin) return roleHome(auth.role!);
      return null;
    },
    routes: <RouteBase>[
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/customer', builder: (_, __) => const CustomerHomeScreen()),
      GoRoute(path: '/customer/new-order', builder: (_, __) => const CreateOrderScreen()),
      GoRoute(
        path: '/customer/orders/:id',
        builder: (_, GoRouterState s) => OrderDetailScreen(orderId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/driver', builder: (_, __) => const RolePlaceholderScreen(role: UserRole.driver)),
      GoRoute(
        path: '/supervisor',
        builder: (_, __) => const RolePlaceholderScreen(role: UserRole.supervisor),
      ),
      GoRoute(
        path: '/accountant',
        builder: (_, __) => const RolePlaceholderScreen(role: UserRole.accountant),
      ),
      GoRoute(
        path: '/workshop',
        builder: (_, __) => const RolePlaceholderScreen(role: UserRole.workshop),
      ),
    ],
  );
});
