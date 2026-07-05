import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/order.dart';
import '../../auth/providers/auth_providers.dart';
import '../data/orders_repository.dart';

final ordersRepositoryProvider = Provider<OrdersRepository>(
  (Ref ref) => OrdersRepository(ref.watch(apiClientProvider)),
);

/// قائمة طلبات العميل (قابلة للتحديث).
final myOrdersProvider = FutureProvider.autoDispose<List<Order>>(
  (Ref ref) => ref.watch(ordersRepositoryProvider).myOrders(),
);

/// تفاصيل طلب واحد.
final orderDetailProvider = FutureProvider.autoDispose.family<Order, String>(
  (Ref ref, String id) => ref.watch(ordersRepositoryProvider).getOrder(id),
);
