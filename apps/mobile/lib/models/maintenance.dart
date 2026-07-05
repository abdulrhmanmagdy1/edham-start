/// نموذج طلب الصيانة (مطابق لـ MaintenanceRequest في الـ Backend).
class MaintenanceRequest {
  const MaintenanceRequest({
    required this.id,
    required this.vehicleId,
    required this.type,
    required this.description,
    required this.status,
    this.cost,
    this.vehiclePlate,
  });

  final String id;
  final String vehicleId;
  final String type;
  final String description;
  final String status;
  final double? cost;
  final String? vehiclePlate;

  String get typeArabic => switch (type) {
        'ROUTINE' => 'دورية',
        'EMERGENCY' => 'طارئة',
        'INSPECTION' => 'فحص',
        _ => type,
      };

  String get statusArabic => switch (status) {
        'OPEN' => 'مفتوح',
        'IN_PROGRESS' => 'قيد التنفيذ',
        'COMPLETED' => 'مكتمل',
        'CANCELLED' => 'ملغى',
        _ => status,
      };

  factory MaintenanceRequest.fromJson(Map<String, dynamic> json) => MaintenanceRequest(
        id: json['id'] as String,
        vehicleId: json['vehicleId'] as String? ?? '',
        type: json['type'] as String? ?? 'ROUTINE',
        description: json['description'] as String? ?? '',
        status: json['status'] as String? ?? 'OPEN',
        cost: (json['cost'] as num?)?.toDouble(),
        vehiclePlate: (json['vehicle'] as Map<String, dynamic>?)?['plateNumber'] as String?,
      );
}
