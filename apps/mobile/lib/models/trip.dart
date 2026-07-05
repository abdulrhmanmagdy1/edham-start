/// نموذج الرحلة (مطابق لـ TripDto).
class Trip {
  const Trip({
    required this.id,
    required this.orderId,
    required this.status,
    required this.totalStops,
    this.recipientName,
  });

  final String id;
  final String orderId;
  final String status;
  final int totalStops;
  final String? recipientName;

  String get statusArabic => switch (status) {
        'ASSIGNED' => 'مُسندة إليك',
        'IN_PROGRESS' => 'جارية',
        'AT_STOP' => 'عند محطة',
        'COMPLETED' => 'مكتملة',
        'CANCELLED' => 'ملغاة',
        _ => status,
      };

  bool get isActive => status != 'COMPLETED' && status != 'CANCELLED';

  factory Trip.fromJson(Map<String, dynamic> json) => Trip(
        id: json['id'] as String,
        orderId: json['orderId'] as String,
        status: json['status'] as String,
        totalStops: (json['totalStops'] as num?)?.toInt() ?? 1,
        recipientName: json['recipientName'] as String?,
      );
}

/// محطة داخل الرحلة (trip_stops).
class TripStop {
  const TripStop({
    required this.id,
    required this.sequenceNumber,
    required this.address,
    required this.status,
    this.city,
    this.contactName,
  });

  final String id;
  final int sequenceNumber;
  final String address;
  final String status;
  final String? city;
  final String? contactName;

  bool get delivered => status == 'DELIVERED';

  factory TripStop.fromJson(Map<String, dynamic> json) => TripStop(
        id: json['id'] as String,
        sequenceNumber: (json['sequenceNumber'] as num).toInt(),
        address: json['address'] as String? ?? '',
        status: json['status'] as String? ?? 'PENDING',
        city: json['city'] as String?,
        contactName: json['contactName'] as String?,
      );
}
