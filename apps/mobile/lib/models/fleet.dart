// نماذج الأسطول: المركبة + السائق + نقطة الموقع.

class Vehicle {
  const Vehicle({
    required this.id,
    required this.plateNumber,
    required this.type,
    required this.temperatureCapability,
    required this.status,
    required this.capacityKg,
  });

  final String id;
  final String plateNumber;
  final String type;
  final String temperatureCapability;
  final String status;
  final double capacityKg;

  bool get isAvailable => status == 'AVAILABLE';

  String get statusArabic => switch (status) {
        'AVAILABLE' => 'متاحة',
        'ON_TRIP' => 'في رحلة',
        'IN_MAINTENANCE' => 'في الصيانة',
        'OUT_OF_SERVICE' => 'خارج الخدمة',
        _ => status,
      };

  factory Vehicle.fromJson(Map<String, dynamic> json) => Vehicle(
        id: json['id'] as String,
        plateNumber: json['plateNumber'] as String? ?? '',
        type: json['type'] as String? ?? '',
        temperatureCapability: json['temperatureCapability'] as String? ?? 'REFRIGERATED',
        status: json['status'] as String? ?? 'AVAILABLE',
        capacityKg: (json['capacityKg'] as num?)?.toDouble() ?? 0,
      );
}

class Driver {
  const Driver({
    required this.id,
    required this.employeeId,
    required this.status,
  });

  final String id;
  final String employeeId;
  final String status;

  bool get isAvailable => status == 'AVAILABLE';

  factory Driver.fromJson(Map<String, dynamic> json) => Driver(
        id: json['id'] as String,
        employeeId: json['employeeId'] as String? ?? '',
        status: json['status'] as String? ?? 'AVAILABLE',
      );
}

class LocationPoint {
  const LocationPoint({
    required this.vehicleId,
    required this.lat,
    required this.lng,
    this.recordedAt,
  });

  final String vehicleId;
  final double lat;
  final double lng;
  final DateTime? recordedAt;

  factory LocationPoint.fromJson(Map<String, dynamic> json) => LocationPoint(
        vehicleId: json['vehicleId'] as String,
        lat: (json['lat'] as num).toDouble(),
        lng: (json['lng'] as num).toDouble(),
        recordedAt: json['recordedAt'] is String
            ? DateTime.tryParse(json['recordedAt'] as String)
            : null,
      );
}
