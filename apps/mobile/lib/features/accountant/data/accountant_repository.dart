import 'package:edham_mobile/core/network/api_client.dart';
import 'package:edham_mobile/models/invoice.dart';
import 'package:edham_mobile/models/order.dart';

/// مستودع بيانات المحاسب: الفواتير + الطلبات الجاهزة للفوترة.
class AccountantRepository {
  AccountantRepository(this._api);

  final ApiClient _api;

  /// قائمة الفواتير المصفّحة ({data, meta}) — نستخدم getList.
  Future<List<Invoice>> invoices({int page = 1, int limit = 20}) async {
    final List<dynamic> data = await _api.getList(
      '/invoices',
      query: <String, dynamic>{'page': page, 'limit': limit},
    );
    return data
        .map((dynamic e) => Invoice.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// تفاصيل فاتورة واحدة.
  Future<Invoice> getInvoice(String id) async {
    final Map<String, dynamic> data = await _api.get('/invoices/$id');
    return Invoice.fromJson(data);
  }

  /// الطلبات المكتملة (COMPLETED) الجاهزة للفوترة.
  Future<List<Order>> completedOrders() async {
    final List<dynamic> data = await _api.getList(
      '/orders',
      query: <String, dynamic>{'status': 'COMPLETED'},
    );
    return data
        .map((dynamic e) => Order.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// إنشاء فاتورة من طلب مكتمل (VAT 15% تلقائي). قد يرجّع 409 لو موجودة.
  Future<Invoice> createInvoice(String orderId) async {
    final Map<String, dynamic> data = await _api.post(
      '/invoices',
      data: <String, dynamic>{'orderId': orderId},
    );
    return Invoice.fromJson(data);
  }

  /// إرسال الفاتورة للعميل (DRAFT → SENT، يحسب تاريخ الاستحقاق).
  Future<Invoice> sendInvoice(String id) async {
    final Map<String, dynamic> data = await _api.post('/invoices/$id/send');
    return Invoice.fromJson(data);
  }

  /// تسجيل الدفع (→ PAID) مع رقم مرجع اختياري.
  Future<Invoice> markPaid(String id, {String? reference}) async {
    final Map<String, dynamic> data = await _api.post(
      '/invoices/$id/mark-paid',
      data: <String, dynamic>{
        if (reference != null && reference.isNotEmpty)
          'paymentReference': reference,
      },
    );
    return Invoice.fromJson(data);
  }
}
