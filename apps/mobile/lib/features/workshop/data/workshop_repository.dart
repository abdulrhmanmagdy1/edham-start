import 'package:edham_mobile/core/network/api_client.dart';
import 'package:edham_mobile/models/fleet.dart';
import 'package:edham_mobile/models/maintenance.dart';

/// طبقة الوصول لبيانات الورشة (طلبات الصيانة + المركبات).
class WorkshopRepository {
  WorkshopRepository(this._api);

  final ApiClient _api;

  /// قائمة كل طلبات الصيانة.
  Future<List<MaintenanceRequest>> requests() async {
    final List<dynamic> data = await _api.getList('/maintenance');
    return data
        .map((dynamic e) => MaintenanceRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// تفاصيل طلب صيانة واحد.
  Future<MaintenanceRequest> getRequest(String id) async {
    final Map<String, dynamic> data = await _api.get('/maintenance/$id');
    return MaintenanceRequest.fromJson(data);
  }

  /// إنشاء طلب صيانة جديد.
  Future<MaintenanceRequest> createRequest({
    required String vehicleId,
    required String type,
    required String description,
  }) async {
    final Map<String, dynamic> data = await _api.post(
      '/maintenance',
      data: <String, dynamic>{
        'vehicleId': vehicleId,
        'type': type,
        'description': description,
      },
    );
    return MaintenanceRequest.fromJson(data);
  }

  /// تحديث حالة الطلب (مع التكلفة والملاحظات اختيارياً).
  Future<MaintenanceRequest> updateStatus(
    String id, {
    required String status,
    double? cost,
    String? notes,
  }) async {
    final Map<String, dynamic> body = <String, dynamic>{'status': status};
    if (cost != null) body['cost'] = cost;
    if (notes != null && notes.isNotEmpty) body['notes'] = notes;
    final Map<String, dynamic> data = await _api.patch('/maintenance/$id/status', data: body);
    return MaintenanceRequest.fromJson(data);
  }

  /// قائمة المركبات (لاختيار المركبة عند إنشاء طلب).
  Future<List<Vehicle>> vehicles() async {
    final List<dynamic> data = await _api.getList('/vehicles');
    return data.map((dynamic e) => Vehicle.fromJson(e as Map<String, dynamic>)).toList();
  }
}
