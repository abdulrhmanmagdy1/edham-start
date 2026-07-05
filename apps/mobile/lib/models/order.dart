/// نموذج الطلب (مطابق لـ OrderDto).
class Order {
  const Order({
    required this.id,
    required this.status,
    required this.pickupAddress,
    required this.deliveryAddress,
    required this.cargoType,
    required this.cargoWeightKg,
    required this.coldChainRequired,
    required this.currency,
    required this.createdAt,
    this.quotedPrice,
    this.pricingNotes,
    this.temperatureType,
  });

  final String id;
  final String status;
  final String pickupAddress;
  final String deliveryAddress;
  final String cargoType;
  final double cargoWeightKg;
  final bool coldChainRequired;
  final String? temperatureType;
  final double? quotedPrice;
  final String? pricingNotes;
  final String currency;
  final DateTime createdAt;

  bool get awaitingCustomerDecision => status == 'PRICED';
  bool get isActive => !<String>['COMPLETED', 'CANCELLED'].contains(status);

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'] as String,
        status: json['status'] as String,
        pickupAddress: json['pickupAddress'] as String? ?? '',
        deliveryAddress: json['deliveryAddress'] as String? ?? '',
        cargoType: json['cargoType'] as String? ?? 'DRY',
        cargoWeightKg: (json['cargoWeightKg'] as num?)?.toDouble() ?? 0,
        coldChainRequired: json['coldChainRequired'] as bool? ?? false,
        temperatureType: json['temperatureType'] as String?,
        quotedPrice: (json['quotedPrice'] as num?)?.toDouble(),
        pricingNotes: json['pricingNotes'] as String?,
        currency: json['currency'] as String? ?? 'SAR',
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      );
}
