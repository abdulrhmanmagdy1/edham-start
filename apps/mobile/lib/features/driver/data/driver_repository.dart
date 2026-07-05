import 'package:edham_mobile/core/network/api_client.dart';
import 'package:edham_mobile/models/trip.dart';

/// يغلّف كل نقاط نهاية السائق (trips / temperature-logs / locations).
class DriverRepository {
  DriverRepository(this._api);

  final ApiClient _api;

  /// قائمة رحلات السائق الحالية.
  Future<List<Trip>> myTrips() async {
    final List<dynamic> data = await _api.getList('/trips/my');
    return data
        .map((dynamic e) => Trip.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// تفاصيل رحلة واحدة.
  Future<Trip> getTrip(String id) async {
    final Map<String, dynamic> data = await _api.get('/trips/$id');
    return Trip.fromJson(data);
  }

  /// محطات الرحلة بالترتيب.
  Future<List<TripStop>> tripStops(String id) async {
    final List<dynamic> data = await _api.getList('/trips/$id/stops');
    return data
        .map((dynamic e) => TripStop.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// تأكيد التحميل (الطلب → LOADING).
  Future<Trip> confirmLoading(String id) async {
    final Map<String, dynamic> data = await _api.post('/trips/$id/confirm-loading');
    return Trip.fromJson(data);
  }

  /// بدء الرحلة (يبدأ تتبّع GPS على الخادم).
  Future<Trip> startTrip(String id) async {
    final Map<String, dynamic> data = await _api.post('/trips/$id/start');
    return Trip.fromJson(data);
  }

  /// تسليم محطة (مع إثبات التسليم الاختياري).
  Future<Trip> deliverStop(
    String tripId,
    String stopId, {
    String? recipientName,
    String? podPhotoUrl,
    String? podSignatureUrl,
  }) async {
    final Map<String, dynamic> body = <String, dynamic>{};
    if (recipientName != null) body['recipientName'] = recipientName;
    if (podPhotoUrl != null) body['podPhotoUrl'] = podPhotoUrl;
    if (podSignatureUrl != null) body['podSignatureUrl'] = podSignatureUrl;
    final Map<String, dynamic> data =
        await _api.post('/trips/$tripId/stops/$stopId/deliver', data: body);
    return Trip.fromJson(data);
  }

  /// الإبلاغ عن مشكلة أثناء الرحلة.
  Future<void> reportIssue(String tripId, String description) async {
    await _api.post(
      '/trips/$tripId/report-issue',
      data: <String, dynamic>{'description': description},
    );
  }

  /// تسجيل قراءة درجة حرارة. يرجّع الاستجابة (تحتوي isViolation).
  Future<Map<String, dynamic>> logTemperature(
    String tripId,
    double temperatureCelsius, {
    String? notes,
  }) async {
    final Map<String, dynamic> body = <String, dynamic>{
      'tripId': tripId,
      'temperatureCelsius': temperatureCelsius,
    };
    if (notes != null && notes.isNotEmpty) body['notes'] = notes;
    return _api.post('/temperature-logs', data: body);
  }

  /// إرسال نقاط GPS. يرجّع {count}.
  Future<Map<String, dynamic>> sendLocations(
    String tripId,
    List<Map<String, dynamic>> points,
  ) async {
    return _api.post(
      '/locations',
      data: <String, dynamic>{'tripId': tripId, 'points': points},
    );
  }
}
