import 'package:flutter/material.dart';

import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/models/trip.dart';

/// شارة حالة الرحلة (ملوّنة حسب الحالة).
class TripStatusBadge extends StatelessWidget {
  const TripStatusBadge({required this.status, super.key});

  final String status;

  @override
  Widget build(BuildContext context) {
    final Color color = StatusColor.of(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _tripStatusArabic(status),
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

/// عربية حالة الرحلة (تشمل حالات لا يغطّيها Trip.statusArabic).
String _tripStatusArabic(String status) => switch (status) {
      'ASSIGNED' => 'مُسندة إليك',
      'LOADING' => 'جاري التحميل',
      'IN_PROGRESS' => 'جارية',
      'AT_STOP' => 'عند محطة',
      'COMPLETED' => 'مكتملة',
      'CANCELLED' => 'ملغاة',
      _ => status,
    };

/// بطاقة رحلة في القائمة.
class TripCard extends StatelessWidget {
  const TripCard({required this.trip, required this.onTap, this.highlight = false, super.key});

  final Trip trip;
  final VoidCallback onTap;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: highlight ? EdhamColors.black : EdhamColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: highlight ? EdhamColors.red : EdhamColors.border,
          width: highlight ? 1.5 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Icon(
                    Icons.local_shipping,
                    size: 20,
                    color: highlight ? Colors.white : EdhamColors.black,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'رحلة #${trip.orderId}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: highlight ? Colors.white : EdhamColors.black,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  TripStatusBadge(status: trip.status),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: <Widget>[
                  Icon(
                    Icons.place_outlined,
                    size: 16,
                    color: highlight ? Colors.white70 : EdhamColors.textMuted,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${trip.totalStops} محطة',
                    style: TextStyle(
                      color: highlight ? Colors.white70 : EdhamColors.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
