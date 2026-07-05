import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/features/auth/providers/auth_providers.dart';
import 'package:edham_mobile/features/supervisor/providers/supervisor_providers.dart';
import 'package:edham_mobile/models/enums.dart';
import 'package:edham_mobile/models/order.dart';

/// فلاتر الحالة المتاحة للمشرف.
class _StatusFilter {
  const _StatusFilter(this.label, this.status);
  final String label;
  final String status; // فارغة = الكل (بلا فلتر)
}

const List<_StatusFilter> _filters = <_StatusFilter>[
  _StatusFilter('بانتظار التسعير', 'PENDING_PRICING'),
  _StatusFilter('مؤكّدة', 'CUSTOMER_CONFIRMED'),
  _StatusFilter('نشطة', 'IN_TRANSIT'),
  _StatusFilter('الكل', ''),
];

class SupervisorHomeScreen extends ConsumerStatefulWidget {
  const SupervisorHomeScreen({super.key});

  @override
  ConsumerState<SupervisorHomeScreen> createState() => _SupervisorHomeScreenState();
}

class _SupervisorHomeScreenState extends ConsumerState<SupervisorHomeScreen> {
  int _selected = 0;

  @override
  Widget build(BuildContext context) {
    final String status = _filters[_selected].status;
    final AsyncValue<List<Order>> orders = ref.watch(ordersByStatusProvider(status));

    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة المشرف'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.map_outlined),
            tooltip: 'الخريطة الحية',
            onPressed: () => context.push('/supervisor/map'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'خروج',
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: Column(
        children: <Widget>[
          _filterBar(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(ordersByStatusProvider(status)),
              child: orders.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (Object e, _) => _ErrorView(
                  message: '$e',
                  onRetry: () => ref.invalidate(ordersByStatusProvider(status)),
                ),
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
          ),
        ],
      ),
    );
  }

  Widget _filterBar() => SizedBox(
        height: 56,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          itemCount: _filters.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (_, int i) {
            final bool active = i == _selected;
            return ChoiceChip(
              label: Text(_filters[i].label),
              selected: active,
              onSelected: (_) => setState(() => _selected = i),
              selectedColor: EdhamColors.red,
              labelStyle: TextStyle(
                color: active ? Colors.white : EdhamColors.black,
                fontWeight: FontWeight.w600,
              ),
              backgroundColor: EdhamColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: EdhamColors.border),
              ),
            );
          },
        ),
      );

  Widget _empty() => ListView(
        children: const <Widget>[
          SizedBox(height: 120),
          Icon(Icons.inbox_outlined, size: 64, color: EdhamColors.textMuted),
          SizedBox(height: 12),
          Text('لا توجد طلبات في هذه الحالة',
              textAlign: TextAlign.center, style: TextStyle(color: EdhamColors.textMuted)),
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
        onTap: () => context.push('/supervisor/orders/${order.id}'),
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
              const SizedBox(height: 6),
              Text(
                'من: ${order.pickupAddress}',
                style: const TextStyle(color: EdhamColors.textMuted, fontSize: 13),
                overflow: TextOverflow.ellipsis,
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
                  const Spacer(),
                  if (order.quotedPrice != null)
                    Text('${order.quotedPrice!.toStringAsFixed(0)} ${order.currency}',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
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
    return ListView(
      children: <Widget>[
        const SizedBox(height: 120),
        const Icon(Icons.error_outline, size: 48, color: EdhamColors.red),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(message, textAlign: TextAlign.center),
        ),
        const SizedBox(height: 12),
        Center(child: TextButton(onPressed: onRetry, child: const Text('إعادة المحاولة'))),
      ],
    );
  }
}
