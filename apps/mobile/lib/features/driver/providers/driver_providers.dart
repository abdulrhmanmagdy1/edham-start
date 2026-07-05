import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:edham_mobile/features/auth/providers/auth_providers.dart';
import 'package:edham_mobile/features/driver/data/driver_repository.dart';
import 'package:edham_mobile/features/driver/data/offline_queue.dart';
import 'package:edham_mobile/models/trip.dart';

final driverRepositoryProvider = Provider<DriverRepository>(
  (Ref ref) => DriverRepository(ref.watch(apiClientProvider)),
);

/// طابور المزامنة offline (Hive).
final offlineQueueProvider = Provider<OfflineQueue>(
  (Ref ref) => const OfflineQueue(),
);

/// قائمة رحلات السائق (قابلة للتحديث).
final myTripsProvider = FutureProvider.autoDispose<List<Trip>>(
  (Ref ref) => ref.watch(driverRepositoryProvider).myTrips(),
);

/// تفاصيل رحلة محدّدة حسب المعرّف.
final tripDetailProvider = FutureProvider.autoDispose.family<Trip, String>(
  (Ref ref, String tripId) => ref.watch(driverRepositoryProvider).getTrip(tripId),
);

/// محطات رحلة محدّدة حسب المعرّف.
final tripStopsProvider = FutureProvider.autoDispose.family<List<TripStop>, String>(
  (Ref ref, String tripId) => ref.watch(driverRepositoryProvider).tripStops(tripId),
);

/// الرحلة النشطة الحالية (أول رحلة غير مكتملة/ملغاة) — أو null.
final activeTripProvider = FutureProvider.autoDispose<Trip?>((Ref ref) async {
  final List<Trip> trips = await ref.watch(driverRepositoryProvider).myTrips();
  for (final Trip t in trips) {
    if (t.isActive) return t;
  }
  return null;
});
