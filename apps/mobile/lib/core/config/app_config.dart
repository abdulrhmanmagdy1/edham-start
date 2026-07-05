/// إعدادات التطبيق العامة.
class AppConfig {
  const AppConfig._();

  /// عنوان الـ API.
  /// - محاكي Android: استخدم 10.0.2.2 بدل localhost.
  /// - جهاز حقيقي: استخدم IP الشبكة المحلية للخادم.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  /// عنوان Socket.io (بدون /api/v1).
  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
}
