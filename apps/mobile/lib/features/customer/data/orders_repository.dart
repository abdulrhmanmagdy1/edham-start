import '../../../core/network/api_client.dart';
import '../../../models/invoice.dart';
import '../../../models/order.dart';
import '../../../models/track.dart';

class OrdersRepository {
  OrdersRepository(this._api);

  final ApiClient _api;

  Future<List<Order>> myOrders() async {
    final List<dynamic> data = await _api.getList('/orders/my');
    return data.map((dynamic e) => Order.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TrackInfo> track(String id) async {
    final Map<String, dynamic> data = await _api.get('/orders/$id/track');
    return TrackInfo.fromJson(data);
  }

  Future<List<Invoice>> myInvoices() async {
    final List<dynamic> data = await _api.getList('/invoices/my');
    return data.map((dynamic e) => Invoice.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Order> getOrder(String id) async {
    final Map<String, dynamic> data = await _api.get('/orders/$id');
    return Order.fromJson(data);
  }

  Future<Order> createOrder(Map<String, dynamic> payload) async {
    final Map<String, dynamic> data = await _api.post('/orders', data: payload);
    return Order.fromJson(data);
  }

  Future<Order> acceptPrice(String id) async {
    final Map<String, dynamic> data = await _api.post('/orders/$id/accept-price');
    return Order.fromJson(data);
  }

  Future<Order> rejectPrice(String id) async {
    final Map<String, dynamic> data = await _api.post('/orders/$id/reject-price');
    return Order.fromJson(data);
  }
}
