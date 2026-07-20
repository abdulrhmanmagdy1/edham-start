import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../theme/app_theme.dart';

/// نقطة على الخريطة.
class OsmPoint {
  const OsmPoint({required this.id, required this.lat, required this.lng, this.label});

  final String id;
  final double lat;
  final double lng;
  final String? label;
}

const LatLng kRiyadh = LatLng(24.7136, 46.6753);

const String _tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const String _userAgent = 'com.edham.logistics';

/// دبّوس بهوية إدهام.
Widget _pin({String? label}) => Tooltip(
      message: label ?? '',
      child: const Icon(Icons.location_on, color: EdhamColors.red, size: 36),
    );

/// خريطة OpenStreetMap — مجانية بلا مفتاح أو فوترة.
/// تعرض نقاطاً (مركبات/شحنة) وتتمركز على أول نقطة.
class OsmMap extends StatelessWidget {
  const OsmMap({required this.points, this.zoom = 11, super.key});

  final List<OsmPoint> points;
  final double zoom;

  @override
  Widget build(BuildContext context) {
    final LatLng center =
        points.isNotEmpty ? LatLng(points.first.lat, points.first.lng) : kRiyadh;

    return FlutterMap(
      options: MapOptions(
        initialCenter: center,
        initialZoom: points.isNotEmpty ? zoom : 6,
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag | InteractiveFlag.doubleTapZoom,
        ),
      ),
      children: <Widget>[
        TileLayer(
          urlTemplate: _tileUrl,
          userAgentPackageName: _userAgent,
          subdomains: const <String>['a', 'b', 'c'],
        ),
        MarkerLayer(
          markers: points
              .map(
                (OsmPoint p) => Marker(
                  point: LatLng(p.lat, p.lng),
                  width: 40,
                  height: 40,
                  alignment: Alignment.topCenter,
                  child: _pin(label: p.label),
                ),
              )
              .toList(),
        ),
        const RichAttributionWidget(
          attributions: <SourceAttribution>[
            TextSourceAttribution('OpenStreetMap contributors'),
          ],
        ),
      ],
    );
  }
}
