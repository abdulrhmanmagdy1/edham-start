import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../models/enums.dart';
import '../auth/providers/auth_providers.dart';

/// شاشة مؤقتة لأدوار سيُبنى تفصيلها لاحقاً في Phase 2 (السائق/المشرف/المحاسب/الورشة).
class RolePlaceholderScreen extends ConsumerWidget {
  const RolePlaceholderScreen({required this.role, super.key});

  final UserRole role;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text('لوحة ${role.arabic}'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'خروج',
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(Icons.construction, size: 64, color: EdhamColors.textMuted),
            const SizedBox(height: 12),
            Text('واجهة ${role.arabic} قيد الإنشاء',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('ستتوفّر في مرحلة لاحقة من Phase 2',
                style: TextStyle(color: EdhamColors.textMuted)),
          ],
        ),
      ),
    );
  }
}
