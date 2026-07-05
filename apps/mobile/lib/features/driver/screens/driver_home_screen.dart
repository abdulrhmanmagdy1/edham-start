import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/features/auth/providers/auth_providers.dart';
import 'package:edham_mobile/features/driver/providers/driver_providers.dart';
import 'package:edham_mobile/features/driver/screens/driver_widgets.dart';
import 'package:edham_mobile/models/trip.dart';

class DriverHomeScreen extends ConsumerWidget {
  const DriverHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Trip>> trips = ref.watch(myTripsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('رحلاتي'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'خروج',
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myTripsProvider),
        child: trips.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (Object e, _) => _ErrorView(
            message: '$e',
            onRetry: () => ref.invalidate(myTripsProvider),
          ),
          data: (List<Trip> list) => _TripsList(trips: list),
        ),
      ),
    );
  }
}

class _TripsList extends StatelessWidget {
  const _TripsList({required this.trips});

  final List<Trip> trips;

  @override
  Widget build(BuildContext context) {
    if (trips.isEmpty) {
      return ListView(
        children: const <Widget>[
          SizedBox(height: 120),
          Icon(Icons.local_shipping_outlined, size: 64, color: EdhamColors.textMuted),
          SizedBox(height: 12),
          Text('لا توجد رحلات حالياً',
              textAlign: TextAlign.center, style: TextStyle(color: EdhamColors.textMuted)),
          SizedBox(height: 4),
          Text('اسحب للأسفل للتحديث',
              textAlign: TextAlign.center, style: TextStyle(color: EdhamColors.textMuted)),
        ],
      );
    }

    final Iterable<Trip> activeTrips = trips.where((Trip t) => t.isActive);
    final Trip? active = activeTrips.isEmpty ? null : activeTrips.first;
    final List<Trip> upcoming =
        trips.where((Trip t) => active == null || t.id != active.id).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        if (active != null) ...<Widget>[
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Text('الرحلة النشطة',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          ),
          TripCard(
            trip: active,
            highlight: true,
            onTap: () => context.push('/driver/trips/${active.id}'),
          ),
          const SizedBox(height: 20),
        ],
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(
            active != null ? 'رحلات أخرى' : 'الرحلات',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
        ),
        if (upcoming.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Text('لا توجد رحلات أخرى',
                textAlign: TextAlign.center, style: TextStyle(color: EdhamColors.textMuted)),
          )
        else
          ...upcoming.map(
            (Trip t) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: TripCard(
                trip: t,
                onTap: () => context.push('/driver/trips/${t.id}'),
              ),
            ),
          ),
      ],
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: <Widget>[
        const SizedBox(height: 120),
        const Icon(Icons.error_outline, size: 48, color: EdhamColors.red),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(message, textAlign: TextAlign.center),
        ),
        const SizedBox(height: 12),
        Center(child: TextButton(onPressed: onRetry, child: const Text('إعادة المحاولة'))),
      ],
    );
  }
}
