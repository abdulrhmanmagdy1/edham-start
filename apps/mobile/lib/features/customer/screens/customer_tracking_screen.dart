import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/osm_map.dart';
import '../../../models/enums.dart';
import '../../../models/track.dart';
import '../providers/orders_providers.dart';

class CustomerTrackingScreen extends ConsumerWidget {
  const CustomerTrackingScreen({required this.orderId, super.key});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<TrackInfo> track = ref.watch(orderTrackProvider(orderId));
    return Scaffold(
      appBar: AppBar(
        title: const Text('تتبع الشحنة'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(orderTrackProvider(orderId)),
          ),
        ],
      ),
      body: track.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (Object e, _) => Center(child: Text('$e')),
        data: (TrackInfo info) => Column(
          children: <Widget>[
            SizedBox(height: 260, child: _map(info)),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: <Widget>[
                  _statusBar(info.status),
                  const SizedBox(height: 16),
                  const Text('المحطات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  if (info.stops.isEmpty)
                    const Text('ستظهر المحطات بعد إسناد السائق', style: TextStyle(color: EdhamColors.textMuted))
                  else
                    ...info.stops.map(_stopTile),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _map(TrackInfo info) {
    if (!info.hasLocation) {
      return Container(
        color: EdhamColors.border.withOpacity(0.4),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Icon(Icons.location_off, color: EdhamColors.textMuted, size: 40),
              SizedBox(height: 8),
              Text('لم يبدأ التتبع الحي بعد', style: TextStyle(color: EdhamColors.textMuted)),
            ],
          ),
        ),
      );
    }
    return OsmMap(
      points: <OsmPoint>[
        OsmPoint(id: 'vehicle', lat: info.lat!, lng: info.lng!, label: 'موقع الشحنة'),
      ],
      zoom: 12,
    );
  }

  Widget _statusBar(String status) {
    final Color color = StatusColor.of(status);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: <Widget>[
          Icon(Icons.local_shipping, color: color),
          const SizedBox(width: 8),
          Text(orderStatusArabic(status), style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _stopTile(TrackStop stop) => ListTile(
        contentPadding: EdgeInsets.zero,
        leading: CircleAvatar(
          backgroundColor: stop.delivered ? EdhamColors.success : EdhamColors.border,
          child: Icon(stop.delivered ? Icons.check : Icons.circle_outlined,
              color: stop.delivered ? Colors.white : EdhamColors.textMuted, size: 18),
        ),
        title: Text('محطة ${stop.sequenceNumber}: ${stop.address}'),
        subtitle: Text(stop.delivered ? 'تم التسليم' : 'قيد الانتظار',
            style: TextStyle(color: stop.delivered ? EdhamColors.success : EdhamColors.textMuted)),
      );
}
