import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';

import 'package:edham_mobile/core/network/api_exception.dart';
import 'package:edham_mobile/features/driver/data/driver_repository.dart';

/// أنواع العمليات المخزّنة محلياً للمزامنة اللاحقة.
enum OfflineOpType { deliverStop, temperatureLog, location }

String _opTypeToApi(OfflineOpType type) => switch (type) {
      OfflineOpType.deliverStop => 'deliverStop',
      OfflineOpType.temperatureLog => 'temperatureLog',
      OfflineOpType.location => 'location',
    };

OfflineOpType? _opTypeFromApi(String value) => switch (value) {
      'deliverStop' => OfflineOpType.deliverStop,
      'temperatureLog' => OfflineOpType.temperatureLog,
      'location' => OfflineOpType.location,
      _ => null,
    };

/// طابور offline بسيط عبر Hive.
///
/// عند فشل POST بسبب انقطاع الاتصال (ApiException بلا statusCode) نخزّن
/// العملية محلياً في box اسمه 'driver_offline'، ونعيد إرسالها لاحقاً عبر
/// [syncPending] عند عودة الاتصال.
class OfflineQueue {
  const OfflineQueue();

  static const String boxName = 'driver_offline';

  Future<Box<String>> _box() async {
    if (Hive.isBoxOpen(boxName)) return Hive.box<String>(boxName);
    return Hive.openBox<String>(boxName);
  }

  Future<void> _enqueue(OfflineOpType type, Map<String, dynamic> payload) async {
    final Box<String> box = await _box();
    await box.add(jsonEncode(<String, dynamic>{
      'type': _opTypeToApi(type),
      'payload': payload,
    }));
  }

  /// خزّن تسليم محطة معطّل الاتصال.
  Future<void> enqueueDeliver({
    required String tripId,
    required String stopId,
    String? recipientName,
    String? podPhotoUrl,
    String? podSignatureUrl,
  }) {
    return _enqueue(OfflineOpType.deliverStop, <String, dynamic>{
      'tripId': tripId,
      'stopId': stopId,
      'recipientName': recipientName,
      'podPhotoUrl': podPhotoUrl,
      'podSignatureUrl': podSignatureUrl,
    });
  }

  /// خزّن قراءة حرارة معطّلة الاتصال.
  Future<void> enqueueTemperature({
    required String tripId,
    required double temperatureCelsius,
    String? notes,
  }) {
    return _enqueue(OfflineOpType.temperatureLog, <String, dynamic>{
      'tripId': tripId,
      'temperatureCelsius': temperatureCelsius,
      'notes': notes,
    });
  }

  /// خزّن نقاط GPS معطّلة الاتصال.
  Future<void> enqueueLocation({
    required String tripId,
    required List<Map<String, dynamic>> points,
  }) {
    return _enqueue(OfflineOpType.location, <String, dynamic>{
      'tripId': tripId,
      'points': points,
    });
  }

  /// عدد العمليات المعلّقة حالياً.
  Future<int> pendingCount() async {
    final Box<String> box = await _box();
    return box.length;
  }

  /// إعادة إرسال العمليات المخزّنة عند عودة الاتصال.
  ///
  /// يرجّع عدد العمليات التي تمّت مزامنتها بنجاح. يتوقّف فور انقطاع الاتصال
  /// من جديد (ApiException بلا statusCode) ويحتفظ بالمتبقّي للمحاولة لاحقاً.
  Future<int> syncPending(DriverRepository repo) async {
    final Box<String> box = await _box();
    if (box.isEmpty) return 0;

    int synced = 0;
    final List<dynamic> keys = box.keys.toList();
    for (final dynamic key in keys) {
      final String? raw = box.get(key);
      if (raw == null) continue;

      final Map<String, dynamic> decoded =
          jsonDecode(raw) as Map<String, dynamic>;
      final OfflineOpType? type = _opTypeFromApi(decoded['type'] as String);
      final Map<String, dynamic> payload =
          (decoded['payload'] as Map<dynamic, dynamic>).cast<String, dynamic>();
      if (type == null) {
        await box.delete(key);
        continue;
      }

      try {
        await _replay(repo, type, payload);
        await box.delete(key);
        synced++;
      } on ApiException catch (e) {
        if (e.statusCode == null) {
          // ما زلنا غير متّصلين — أوقف المزامنة واحتفظ بالمتبقّي.
          break;
        }
        // رفض الخادم العملية (مثلاً محطة مُسلّمة سابقاً) — أسقطها.
        await box.delete(key);
      }
    }
    return synced;
  }

  Future<void> _replay(
    DriverRepository repo,
    OfflineOpType type,
    Map<String, dynamic> payload,
  ) async {
    switch (type) {
      case OfflineOpType.deliverStop:
        await repo.deliverStop(
          payload['tripId'] as String,
          payload['stopId'] as String,
          recipientName: payload['recipientName'] as String?,
          podPhotoUrl: payload['podPhotoUrl'] as String?,
          podSignatureUrl: payload['podSignatureUrl'] as String?,
        );
      case OfflineOpType.temperatureLog:
        await repo.logTemperature(
          payload['tripId'] as String,
          (payload['temperatureCelsius'] as num).toDouble(),
          notes: payload['notes'] as String?,
        );
      case OfflineOpType.location:
        final List<Map<String, dynamic>> points = (payload['points'] as List<dynamic>)
            .map((dynamic e) => (e as Map<dynamic, dynamic>).cast<String, dynamic>())
            .toList();
        await repo.sendLocations(payload['tripId'] as String, points);
    }
  }
}
