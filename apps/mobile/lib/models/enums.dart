// Enums مطابقة لـ packages/shared-types (عقد الـ API).

enum UserRole { customer, driver, supervisor, accountant, workshop }

extension UserRoleX on UserRole {
  String get api => switch (this) {
        UserRole.customer => 'CUSTOMER',
        UserRole.driver => 'DRIVER',
        UserRole.supervisor => 'SUPERVISOR',
        UserRole.accountant => 'ACCOUNTANT',
        UserRole.workshop => 'WORKSHOP',
      };

  String get arabic => switch (this) {
        UserRole.customer => 'عميل',
        UserRole.driver => 'سائق',
        UserRole.supervisor => 'مشرف',
        UserRole.accountant => 'محاسب',
        UserRole.workshop => 'ورشة',
      };

  static UserRole fromApi(String value) => switch (value) {
        'CUSTOMER' => UserRole.customer,
        'DRIVER' => UserRole.driver,
        'SUPERVISOR' => UserRole.supervisor,
        'ACCOUNTANT' => UserRole.accountant,
        'WORKSHOP' => UserRole.workshop,
        _ => UserRole.customer,
      };
}

/// حالات الطلب (عربي للعرض).
String orderStatusArabic(String status) => switch (status) {
      'DRAFT' => 'مسودة',
      'PENDING_PRICING' => 'بانتظار التسعير',
      'PRICED' => 'بانتظار موافقتك على السعر',
      'CUSTOMER_CONFIRMED' => 'مؤكّد — بانتظار الإسناد',
      'ASSIGNED' => 'تم تخصيص سائق',
      'LOADING' => 'جاري التحميل',
      'IN_TRANSIT' => 'في الطريق',
      'DELIVERED' => 'تم التسليم',
      'COMPLETED' => 'مكتمل',
      'CANCELLED' => 'ملغى',
      _ => status,
    };

enum VehicleType { hiaceVan, isuzuRefrigerated, volvoFhHeavy }

extension VehicleTypeX on VehicleType {
  String get api => switch (this) {
        VehicleType.hiaceVan => 'HIACE_VAN',
        VehicleType.isuzuRefrigerated => 'ISUZU_REFRIGERATED',
        VehicleType.volvoFhHeavy => 'VOLVO_FH_HEAVY',
      };

  String get arabic => switch (this) {
        VehicleType.hiaceVan => 'فان (هايس)',
        VehicleType.isuzuRefrigerated => 'شاحنة مبردة (إيسوزو)',
        VehicleType.volvoFhHeavy => 'شاحنة ثقيلة (فولفو)',
      };
}

enum CargoType { dry, chilled, frozen, hazardous }

extension CargoTypeX on CargoType {
  String get api => switch (this) {
        CargoType.dry => 'DRY',
        CargoType.chilled => 'CHILLED',
        CargoType.frozen => 'FROZEN',
        CargoType.hazardous => 'HAZARDOUS',
      };

  String get arabic => switch (this) {
        CargoType.dry => 'جافة',
        CargoType.chilled => 'مبردة',
        CargoType.frozen => 'مجمدة',
        CargoType.hazardous => 'خطرة',
      };
}

enum TemperatureType { refrigerated, frozen }

extension TemperatureTypeX on TemperatureType {
  String get api => this == TemperatureType.refrigerated ? 'REFRIGERATED' : 'FROZEN';
  String get arabic => this == TemperatureType.refrigerated ? 'مبرد (2 - 8°)' : 'مجمد (أقل من -18°)';
}
