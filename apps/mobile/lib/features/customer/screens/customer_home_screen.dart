import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../models/enums.dart';
import '../../../models/order.dart';
import '../../auth/providers/auth_providers.dart';
import '../providers/orders_providers.dart';

class CustomerHomeScreen extends ConsumerWidget {
  const CustomerHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Order>> orders = ref.watch(myOrdersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('طلباتي'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'خروج',
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: EdhamColors.red,
        foregroundColor: Colors.white,
        onPressed: () => context.push('/customer/new-order'),
        icon: const Icon(Icons.add),
        label: const Text('طلب شحن جديد'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myOrdersProvider),
        child: orders.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (Object e, _) => _ErrorView(message: '$e', onRetry: () => ref.invalidate(myOrdersProvider)),
          data: (List<Order> list) => list.isEmpty
              ? _empty()
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, int i) => _OrderCard(order: list[i]),
                ),
        ),
      ),
    );
  }

  Widget _empty() => ListView(
        children: const <Widget>[
          SizedBox(height: 120),
          Icon(Icons.inbox_outlined, size: 64, color: EdhamColors.textMuted),
          SizedBox(height: 12),
          Text('لا توجد طلبات بعد', textAlign: TextAlign.center, style: TextStyle(color: EdhamColors.textMuted)),
          SizedBox(height: 4),
          Text('اضغط "طلب شحن جديد" للبدء', textAlign: TextAlign.center, style: TextStyle(color: EdhamColors.textMuted)),
        ],
      );
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/customer/orders/${order.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      order.deliveryAddress,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  _StatusBadge(status: order.status),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: <Widget>[
                  const Icon(Icons.scale, size: 16, color: EdhamColors.textMuted),
                  const SizedBox(width: 4),
                  Text('${order.cargoWeightKg.toStringAsFixed(0)} كجم',
                      style: const TextStyle(color: EdhamColors.textMuted)),
                  const SizedBox(width: 16),
                  if (order.coldChainRequired) ...<Widget>[
                    const Icon(Icons.ac_unit, size: 16, color: EdhamColors.red),
                    const SizedBox(width: 4),
                    const Text('مبرّدة', style: TextStyle(color: EdhamColors.red)),
                  ],
                ],
              ),
              if (order.awaitingCustomerDecision) ...<Widget>[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: EdhamColors.red.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'عرض سعر بانتظار موافقتك: ${order.quotedPrice?.toStringAsFixed(0)} ${order.currency}',
                    style: const TextStyle(color: EdhamColors.red, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final Color color = StatusColor.of(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        orderStatusArabic(status),
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(Icons.error_outline, size: 48, color: EdhamColors.red),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(message, textAlign: TextAlign.center),
          ),
          const SizedBox(height: 12),
          TextButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
        ],
      ),
    );
  }
}
