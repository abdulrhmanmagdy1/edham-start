import 'package:edham_mobile/core/network/api_client.dart';
import 'package:edham_mobile/models/fleet.dart';
import 'package:edham_mobile/models/order.dart';

/// يغلّف endpoints دور المشرف (طلبات + تسعير + إسناد + أسطول).
class SupervisorRepository {
  SupervisorRepository(this._api);

  final ApiClient _api;

  /// قائمة الطلبات حسب الحالة. لو [status] فارغة تُجلب كل الطلبات.
  Future<List<Order>> ordersByStatus(String status) async {
    final Map<String, dynamic>? query =
        status.isEmpty ? null : <String, dynamic>{'status': status};
    final List<dynamic> data = await _api.getList('/orders', query: query);
    return data
        .map((dynamic e) => Order.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Order> getOrder(String id) async {
    final Map<String, dynamic> data = await _api.get('/orders/$id');
    return Order.fromJson(data);
  }

  /// تحديد السعر يدوياً وإرساله للعميل.
  Future<Order> setPrice(String id, double quotedPrice, {String? pricingNotes}) async {
    final Map<String, dynamic> body = <String, dynamic>{'quotedPrice': quotedPrice};
    if (pricingNotes != null && pricingNotes.isNotEmpty) {
      body['pricingNotes'] = pricingNotes;
    }
    final Map<String, dynamic> data = await _api.patch('/orders/$id/set-price', data: body);
    return Order.fromJson(data);
  }

  /// إسناد سائق + مركبة (فقط بعد CUSTOMER_CONFIRMED).
  Future<Order> assign(String id, {required String driverId, required String vehicleId}) async {
    final Map<String, dynamic> data = await _api.post(
      '/orders/$id/assign',
      data: <String, dynamic>{'driverId': driverId, 'vehicleId': vehicleId},
    );
    return Order.fromJson(data);
  }

  Future<List<Driver>> drivers() async {
    final List<dynamic> data = await _api.getList('/drivers');
    return data
        .map((dynamic e) => Driver.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// المركبات المتاحة. [temperatureType] فقط لو الطلب يحتاج تبريد.
  Future<List<Vehicle>> availableVehicles({String? temperatureType}) async {
    final Map<String, dynamic>? query = temperatureType == null
        ? null
        : <String, dynamic>{'temperatureType': temperatureType};
    final List<dynamic> data = await _api.getList('/vehicles/available', query: query);
    return data
        .map((dynamic e) => Vehicle.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// آخر موقع لكل مركبة (الخريطة الحية).
  Future<List<LocationPoint>> fleet() async {
    final List<dynamic> data = await _api.getList('/locations/fleet');
    return data
        .map((dynamic e) => LocationPoint.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
