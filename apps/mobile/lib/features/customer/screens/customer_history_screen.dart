import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../models/enums.dart';
import '../../../models/order.dart';
import '../providers/orders_providers.dart';

/// سجل الطلبات المنتهية (مكتملة/ملغاة).
class CustomerHistoryScreen extends ConsumerWidget {
  const CustomerHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Order>> orders = ref.watch(myOrdersProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('سجل الطلبات')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myOrdersProvider),
        child: orders.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (Object e, _) => Center(child: Text('$e')),
          data: (List<Order> all) {
            final List<Order> past = all.where((Order o) => !o.isActive).toList();
            if (past.isEmpty) {
              return ListView(children: const <Widget>[
                SizedBox(height: 120),
                Icon(Icons.history, size: 56, color: EdhamColors.textMuted),
                SizedBox(height: 12),
                Text('لا يوجد سجل بعد', textAlign: TextAlign.center, style: TextStyle(color: EdhamColors.textMuted)),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: past.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, int i) {
                final Order o = past[i];
                final Color color = StatusColor.of(o.status);
                return Card(
                  child: ListTile(
                    onTap: () => context.push('/customer/orders/${o.id}'),
                    title: Text(o.deliveryAddress, maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text('${o.cargoWeightKg.toStringAsFixed(0)} كجم'),
                    trailing: Text(orderStatusArabic(o.status),
                        style: TextStyle(color: color, fontWeight: FontWeight.w600)),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
