import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const ProviderScope(child: EdhamApp()));
}

/// ألوان هوية إدهام للوجستيات.
class EdhamColors {
  const EdhamColors._();

  static const Color primary = Color(0xFF0D0D0D);
  static const Color accent = Color(0xFFDC2626);
}

class EdhamApp extends StatelessWidget {
  const EdhamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'إدهام للوجستيات',
      debugShowCheckedModeBanner: false,
      // دعم العربية والاتجاه من اليمين لليسار (RTL).
      locale: const Locale('ar'),
      supportedLocales: const <Locale>[Locale('ar')],
      localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: EdhamColors.accent,
          primary: EdhamColors.primary,
          secondary: EdhamColors.accent,
        ),
        scaffoldBackgroundColor: Colors.white,
        appBarTheme: const AppBarTheme(
          backgroundColor: EdhamColors.primary,
          foregroundColor: Colors.white,
          centerTitle: true,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // فرض اتجاه RTL لكامل الشاشة.
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('إدهام للوجستيات')),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Icon(
                Icons.local_shipping,
                size: 72,
                color: EdhamColors.accent,
              ),
              SizedBox(height: 16),
              Text(
                'إدهام للوجستيات',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: EdhamColors.primary,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'منصة الشحن المبرّد والتتبع الحي',
                style: TextStyle(fontSize: 16, color: Colors.black54),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
