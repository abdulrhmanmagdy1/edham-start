import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/token_storage.dart';
import 'api_exception.dart';

/// عميل HTTP موحّد (Dio) مع:
/// - إرفاق access token تلقائياً.
/// - تجديد التوكن عند 401 مرة واحدة ثم إعادة المحاولة.
/// - فكّ غلاف الاستجابة { success, data }.
class ApiClient {
  ApiClient(this._storage) : _dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl)) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (RequestOptions options, RequestInterceptorHandler handler) {
          final String? token = _storage.accessToken;
          if (token != null && options.extra['auth'] != false) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (DioException e, ErrorInterceptorHandler handler) async {
          final bool isAuthCall = e.requestOptions.path.contains('/auth/');
          if (e.response?.statusCode == 401 && !isAuthCall && _storage.refreshToken != null) {
            try {
              await _refreshToken();
              // إعادة المحاولة بالتوكن الجديد صراحةً (لا نعتمد على إعادة تطبيق الترويسة)
              e.requestOptions.headers['Authorization'] = 'Bearer ${_storage.accessToken}';
              final Response<dynamic> retry = await _dio.fetch<dynamic>(e.requestOptions);
              return handler.resolve(retry);
            } catch (_) {
              await _storage.clear();
            }
          }
          handler.next(e);
        },
      ),
    );
  }

  final Dio _dio;
  final TokenStorage _storage;

  Future<void> _refreshToken() async {
    // Dio منفصل بلا interceptors — يتجنّب تداخل/تكرار عند تجديد التوكن
    final Dio refreshDio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));
    final Response<dynamic> res = await refreshDio.post<dynamic>(
      '/auth/refresh',
      data: <String, dynamic>{'refreshToken': _storage.refreshToken},
    );
    final Map<String, dynamic> data = _unwrap(res.data);
    final String? token = data['accessToken'] as String?;
    if (token == null) {
      throw StateError('لا يوجد accessToken في استجابة التجديد');
    }
    await _storage.updateAccessToken(token);
  }

  Map<String, dynamic> _unwrap(Object? body) {
    if (body is Map<String, dynamic> && body['data'] is Map<String, dynamic>) {
      return body['data'] as Map<String, dynamic>;
    }
    return body is Map<String, dynamic> ? body : <String, dynamic>{};
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) async {
    return _run(() => _dio.get<dynamic>(path, queryParameters: query));
  }

  Future<List<dynamic>> getList(String path, {Map<String, dynamic>? query}) async {
    try {
      final Response<dynamic> res = await _dio.get<dynamic>(path, queryParameters: query);
      final Object? body = res.data;
      if (body is Map<String, dynamic> && body['data'] is List) {
        return body['data'] as List<dynamic>;
      }
      return <dynamic>[];
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<Map<String, dynamic>> post(String path, {Object? data, bool auth = true}) async {
    return _run(() => _dio.post<dynamic>(
          path,
          data: data,
          options: Options(extra: <String, dynamic>{'auth': auth}),
        ));
  }

  Future<Map<String, dynamic>> patch(String path, {Object? data}) async {
    return _run(() => _dio.patch<dynamic>(path, data: data));
  }

  Future<Map<String, dynamic>> _run(Future<Response<dynamic>> Function() call) async {
    try {
      final Response<dynamic> res = await call();
      return _unwrap(res.data);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
