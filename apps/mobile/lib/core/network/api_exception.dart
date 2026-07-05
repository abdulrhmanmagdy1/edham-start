import 'package:dio/dio.dart';

/// خطأ API موحّد يحمل رسالة عربية من الخادم (envelope: error.message).
class ApiException implements Exception {
  const ApiException(this.message, {this.code, this.statusCode});

  final String message;
  final String? code;
  final int? statusCode;

  factory ApiException.fromDio(DioException e) {
    final Object? data = e.response?.data;
    if (data is Map && data['error'] is Map) {
      final Map<dynamic, dynamic> err = data['error'] as Map<dynamic, dynamic>;
      return ApiException(
        err['message'] as String? ?? 'حدث خطأ غير متوقع',
        code: err['code'] as String?,
        statusCode: e.response?.statusCode,
      );
    }
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout) {
      return const ApiException('تعذّر الاتصال بالخادم — تحقّق من الإنترنت');
    }
    return ApiException('حدث خطأ غير متوقع', statusCode: e.response?.statusCode);
  }

  @override
  String toString() => message;
}
