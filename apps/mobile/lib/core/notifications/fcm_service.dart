import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

/// معالج رسائل الخلفية (يجب أن يكون top-level).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('FCM (خلفية): ${message.notification?.title}');
}

/// خدمة إشعارات FCM (SPEC Feature 5).
///
/// ملاحظة: التفعيل الفعلي يتطلب google-services.json (أندرويد) +
/// GoogleService-Info.plist (iOS) + FIREBASE_SERVER_KEY صالح في الخادم.
/// حتى تتوفّر، الـ init محميّ بـ try/catch فلا يُعطّل التطبيق (مؤجَّل — Phase 4).
class FcmService {
  const FcmService._();

  static String? lastToken;

  static Future<void> init() async {
    try {
      await Firebase.initializeApp();
      final FirebaseMessaging messaging = FirebaseMessaging.instance;

      await messaging.requestPermission();
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      lastToken = await messaging.getToken();
      debugPrint('FCM token: $lastToken');
      // TODO(Phase 4): إرسال lastToken للخادم لتسجيل الجهاز عند توفّر endpoint.

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('FCM (مقدمة): ${message.notification?.title}');
      });
    } catch (error) {
      // Firebase غير مُهيّأ (لا ملف إعداد) — نتجاهل بأمان.
      debugPrint('FCM غير مُفعّل حالياً: $error');
    }
  }
}
