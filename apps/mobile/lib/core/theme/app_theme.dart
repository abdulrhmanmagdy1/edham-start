import 'package:flutter/material.dart';

/// ألوان هوية إدهام (DEC-005): أسود #0D0D0D + أحمر #DC2626.
class EdhamColors {
  const EdhamColors._();

  static const Color black = Color(0xFF0D0D0D);
  static const Color red = Color(0xFFDC2626);
  static const Color bg = Color(0xFFF7F7F8);
  static const Color surface = Colors.white;
  static const Color textMuted = Color(0xFF6B7280);
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFF59E0B);
  static const Color border = Color(0xFFE5E7EB);
}

/// حالات الطلب بألوانها (لواجهة العميل).
class StatusColor {
  const StatusColor._();

  static Color of(String status) {
    switch (status) {
      case 'PENDING_PRICING':
        return EdhamColors.warning;
      case 'PRICED':
        return EdhamColors.red;
      case 'CUSTOMER_CONFIRMED':
      case 'ASSIGNED':
      case 'LOADING':
      case 'IN_TRANSIT':
        return EdhamColors.black;
      case 'COMPLETED':
        return EdhamColors.success;
      case 'CANCELLED':
        return EdhamColors.textMuted;
      default:
        return EdhamColors.textMuted;
    }
  }
}

class AppTheme {
  const AppTheme._();

  // TODO(Phase 2): إضافة خط IBM Plex Sans Arabic كـ asset (fonts في pubspec).
  static ThemeData get light {
    final ColorScheme scheme = ColorScheme.fromSeed(
      seedColor: EdhamColors.red,
      primary: EdhamColors.black,
      secondary: EdhamColors.red,
      surface: EdhamColors.surface,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: EdhamColors.bg,
      appBarTheme: const AppBarTheme(
        backgroundColor: EdhamColors.black,
        foregroundColor: Colors.white,
        centerTitle: true,
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: EdhamColors.red,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: EdhamColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: EdhamColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: EdhamColors.border),
        ),
      ),
      cardTheme: CardTheme(
        color: EdhamColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: EdhamColors.border),
        ),
      ),
    );
  }
}
