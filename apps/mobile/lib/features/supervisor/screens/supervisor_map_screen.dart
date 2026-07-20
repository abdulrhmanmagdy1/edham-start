import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/core/widgets/osm_map.dart';
import 'package:edham_mobile/features/supervisor/providers/supervisor_providers.dart';
import 'package:edham_mobile/models/fleet.dart';

class SupervisorMapScreen extends ConsumerStatefulWidget {
  const SupervisorMapScreen({super.key});

  @override
  ConsumerState<SupervisorMapScreen> createState() => _SupervisorMapScreenState();
}

class _SupervisorMapScreenState extends ConsumerState<SupervisorMapScreen> {
  List<OsmPoint> _points(List<LocationPoint> points) => points
      .map((LocationPoint p) => OsmPoint(
            id: p.vehicleId,
            lat: p.lat,
            lng: p.lng,
            label: 'مركبة ${p.vehicleId}',
          ))
      .toList();

  @override
  Widget build(BuildContext context) {
    final AsyncValue<List<LocationPoint>> fleet = ref.watch(fleetProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('الخريطة الحية'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: () => ref.invalidate(fleetProvider),
          ),
        ],
      ),
      body: fleet.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (Object e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('$e', textAlign: TextAlign.center),
          ),
        ),
        data: (List<LocationPoint> points) {
          if (points.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Icon(Icons.location_off_outlined, size: 64, color: EdhamColors.textMuted),
                  SizedBox(height: 12),
                  Text('لا توجد مركبات نشطة على الخريطة حالياً',
                      style: TextStyle(color: EdhamColors.textMuted)),
                ],
              ),
            );
          }
          return OsmMap(points: _points(points), zoom: 10);
        },
      ),
    );
  }
}
