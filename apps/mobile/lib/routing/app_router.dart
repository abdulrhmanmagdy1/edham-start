import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/accountant/screens/accountant_home_screen.dart';
import '../features/accountant/screens/accountant_invoice_screen.dart';
import '../features/auth/providers/auth_providers.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/customer/screens/create_order_screen.dart';
import '../features/customer/screens/customer_history_screen.dart';
import '../features/customer/screens/customer_home_screen.dart';
import '../features/customer/screens/customer_invoices_screen.dart';
import '../features/customer/screens/customer_tracking_screen.dart';
import '../features/customer/screens/order_detail_screen.dart';
import '../features/driver/screens/driver_home_screen.dart';
import '../features/driver/screens/driver_trip_screen.dart';
import '../features/supervisor/screens/supervisor_home_screen.dart';
import '../features/supervisor/screens/supervisor_map_screen.dart';
import '../features/supervisor/screens/supervisor_order_screen.dart';
import '../features/workshop/screens/workshop_home_screen.dart';
import '../features/workshop/screens/workshop_maintenance_screen.dart';
import '../features/workshop/screens/workshop_new_request_screen.dart';
import '../models/enums.dart';

String roleHome(UserRole role) => switch (role) {
      UserRole.customer => '/customer',
      UserRole.driver => '/driver',
      UserRole.supervisor => '/supervisor',
      UserRole.accountant => '/accountant',
      UserRole.workshop => '/workshop',
    };

String _id(GoRouterState s) => s.pathParameters['id']!;

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

      // ── العميل ──
      GoRoute(path: '/customer', builder: (_, __) => const CustomerHomeScreen()),
      GoRoute(path: '/customer/new-order', builder: (_, __) => const CreateOrderScreen()),
      GoRoute(path: '/customer/history', builder: (_, __) => const CustomerHistoryScreen()),
      GoRoute(path: '/customer/invoices', builder: (_, __) => const CustomerInvoicesScreen()),
      GoRoute(
        path: '/customer/orders/:id',
        builder: (_, GoRouterState s) => OrderDetailScreen(orderId: _id(s)),
      ),
      GoRoute(
        path: '/customer/orders/:id/track',
        builder: (_, GoRouterState s) => CustomerTrackingScreen(orderId: _id(s)),
      ),

      // ── السائق ──
      GoRoute(path: '/driver', builder: (_, __) => const DriverHomeScreen()),
      GoRoute(
        path: '/driver/trips/:id',
        builder: (_, GoRouterState s) => DriverTripScreen(tripId: _id(s)),
      ),

      // ── المشرف ──
      GoRoute(path: '/supervisor', builder: (_, __) => const SupervisorHomeScreen()),
      GoRoute(path: '/supervisor/map', builder: (_, __) => const SupervisorMapScreen()),
      GoRoute(
        path: '/supervisor/orders/:id',
        builder: (_, GoRouterState s) => SupervisorOrderScreen(orderId: _id(s)),
      ),

      // ── المحاسب ──
      GoRoute(path: '/accountant', builder: (_, __) => const AccountantHomeScreen()),
      GoRoute(
        path: '/accountant/invoices/:id',
        builder: (_, GoRouterState s) => AccountantInvoiceScreen(invoiceId: _id(s)),
      ),

      // ── الورشة ──
      GoRoute(path: '/workshop', builder: (_, __) => const WorkshopHomeScreen()),
      GoRoute(path: '/workshop/new', builder: (_, __) => const WorkshopNewRequestScreen()),
      GoRoute(
        path: '/workshop/maintenance/:id',
        builder: (_, GoRouterState s) => WorkshopMaintenanceScreen(requestId: _id(s)),
      ),
    ],
  );
});
