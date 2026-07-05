import 'package:edham_mobile/features/auth/providers/auth_providers.dart';
import 'package:edham_mobile/features/workshop/data/workshop_repository.dart';
import 'package:edham_mobile/models/fleet.dart';
import 'package:edham_mobile/models/maintenance.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final workshopRepositoryProvider = Provider<WorkshopRepository>(
  (Ref ref) => WorkshopRepository(ref.watch(apiClientProvider)),
);

/// قائمة طلبات الصيانة (قابلة للتحديث).
final maintenanceListProvider = FutureProvider.autoDispose<List<MaintenanceRequest>>(
  (Ref ref) => ref.watch(workshopRepositoryProvider).requests(),
);

/// تفاصيل طلب صيانة واحد.
final maintenanceDetailProvider =
    FutureProvider.autoDispose.family<MaintenanceRequest, String>(
  (Ref ref, String id) => ref.watch(workshopRepositoryProvider).getRequest(id),
);

/// قائمة المركبات (لنموذج إنشاء الطلب).
final workshopVehiclesProvider = FutureProvider.autoDispose<List<Vehicle>>(
  (Ref ref) => ref.watch(workshopRepositoryProvider).vehicles(),
);
