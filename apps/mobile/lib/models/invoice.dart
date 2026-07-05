/// نموذج الفاتورة (مطابق لـ InvoiceDto).
class Invoice {
  const Invoice({
    required this.id,
    required this.invoiceNumber,
    required this.subtotal,
    required this.vatAmount,
    required this.totalAmount,
    required this.currency,
    required this.status,
    this.issuedAt,
    this.dueAt,
    this.paidAt,
  });

  final String id;
  final String invoiceNumber;
  final double subtotal;
  final double vatAmount;
  final double totalAmount;
  final String currency;
  final String status;
  final DateTime? issuedAt;
  final DateTime? dueAt;
  final DateTime? paidAt;

  bool get isOverdue =>
      status != 'PAID' && dueAt != null && dueAt!.isBefore(DateTime.now());

  String get statusArabic => switch (status) {
        'DRAFT' => 'مسودة',
        'SENT' => 'مُرسَلة',
        'PAID' => 'مدفوعة',
        'OVERDUE' => 'متأخرة',
        'CANCELLED' => 'ملغاة',
        _ => status,
      };

  static DateTime? _date(Object? v) => v is String ? DateTime.tryParse(v) : null;

  factory Invoice.fromJson(Map<String, dynamic> json) => Invoice(
        id: json['id'] as String,
        invoiceNumber: json['invoiceNumber'] as String? ?? '',
        subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
        vatAmount: (json['vatAmount'] as num?)?.toDouble() ?? 0,
        totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
        currency: json['currency'] as String? ?? 'SAR',
        status: json['status'] as String? ?? 'DRAFT',
        issuedAt: _date(json['issuedAt']),
        dueAt: _date(json['dueAt']),
        paidAt: _date(json['paidAt']),
      );
}
