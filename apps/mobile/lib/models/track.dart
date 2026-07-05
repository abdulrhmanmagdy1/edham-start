/// معلومات تتبع الطلب (GET /orders/:id/track).
class TrackInfo {
  const TrackInfo({
    required this.orderId,
    required this.status,
    required this.stops,
    this.tripStatus,
    this.lat,
    this.lng,
  });

  final String orderId;
  final String status;
  final String? tripStatus;
  final double? lat;
  final double? lng;
  final List<TrackStop> stops;

  bool get hasLocation => lat != null && lng != null;

  factory TrackInfo.fromJson(Map<String, dynamic> json) {
    final Map<String, dynamic>? trip = json['trip'] as Map<String, dynamic>?;
    final Map<String, dynamic>? loc = json['lastLocation'] as Map<String, dynamic>?;
    final List<dynamic> stops = json['stops'] as List<dynamic>? ?? <dynamic>[];
    return TrackInfo(
      orderId: json['orderId'] as String,
      status: json['status'] as String,
      tripStatus: trip?['status'] as String?,
      lat: (loc?['lat'] as num?)?.toDouble(),
      lng: (loc?['lng'] as num?)?.toDouble(),
      stops: stops
          .map((dynamic e) => TrackStop.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class TrackStop {
  const TrackStop({required this.sequenceNumber, required this.address, required this.status});

  final int sequenceNumber;
  final String address;
  final String status;

  bool get delivered => status == 'DELIVERED';

  factory TrackStop.fromJson(Map<String, dynamic> json) => TrackStop(
        sequenceNumber: (json['sequenceNumber'] as num).toInt(),
        address: json['address'] as String? ?? '',
        status: json['status'] as String? ?? 'PENDING',
      );
}
