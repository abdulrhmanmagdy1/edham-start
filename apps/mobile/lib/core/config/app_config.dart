/// إعدادات التطبيق العامة.
class AppConfig {
  const AppConfig._();

  /// عنوان الـ API (الإنتاج المرفوع على Railway افتراضياً).
  /// يمكن تجاوزه وقت البناء: --dart-define=API_BASE_URL=...
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api-production-08eb.up.railway.app/api/v1',
  );

  /// عنوان Socket.io (بدون /api/v1).
  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'https://api-production-08eb.up.railway.app',
  );

  /// وضع التجربة: يعرض رمز OTP على الشاشة (للعروض فقط — أطفئه في الإطلاق الحقيقي).
  static const bool demoMode = bool.fromEnvironment('DEMO_MODE', defaultValue: true);
}
