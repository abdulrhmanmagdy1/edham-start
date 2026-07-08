// اختبار دخان بسيط — يتحقق من إعدادات التطبيق الأساسية.
import 'package:flutter_test/flutter_test.dart';

import 'package:edham_mobile/core/config/app_config.dart';

void main() {
  test('عنوان الـ API يتضمّن /api/v1', () {
    expect(AppConfig.apiBaseUrl, contains('/api/v1'));
  });

  test('عنوان الـ Socket بلا /api/v1', () {
    expect(AppConfig.socketUrl.contains('/api/v1'), isFalse);
  });
}
