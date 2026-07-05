import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:edham_mobile/features/auth/providers/auth_providers.dart';
import 'package:edham_mobile/features/supervisor/data/supervisor_repository.dart';
import 'package:edham_mobile/models/fleet.dart';
import 'package:edham_mobile/models/order.dart';

final supervisorRepositoryProvider = Provider<SupervisorRepository>(
  (Ref ref) => SupervisorRepository(ref.watch(apiClientProvider)),
);

/// طلبات المشرف حسب الحالة (مفتاح العائلة = قيمة status، فارغة = الكل).
final ordersByStatusProvider =
    FutureProvider.autoDispose.family<List<Order>, String>(
  (Ref ref, String status) =>
      ref.watch(supervisorRepositoryProvider).ordersByStatus(status),
);

/// تفاصيل طلب واحد للمشرف.
final supervisorOrderProvider =
    FutureProvider.autoDispose.family<Order, String>(
  (Ref ref, String id) => ref.watch(supervisorRepositoryProvider).getOrder(id),
);

/// آخر موقع لكل مركبة (الخريطة الحية).
final fleetProvider = FutureProvider.autoDispose<List<LocationPoint>>(
  (Ref ref) => ref.watch(supervisorRepositoryProvider).fleet(),
);
