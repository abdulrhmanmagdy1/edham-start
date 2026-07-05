import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/enums.dart';
import '../../../models/order.dart';
import '../data/orders_repository.dart';
import '../providers/orders_providers.dart';

class OrderDetailScreen extends ConsumerStatefulWidget {
  const OrderDetailScreen({required this.orderId, super.key});

  final String orderId;

  @override
  ConsumerState<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends ConsumerState<OrderDetailScreen> {
  bool _busy = false;

  Future<void> _decide({required bool accept}) async {
    setState(() => _busy = true);
    try {
      final OrdersRepository repo = ref.read(ordersRepositoryProvider);
      if (accept) {
        await repo.acceptPrice(widget.orderId);
      } else {
        await repo.rejectPrice(widget.orderId);
      }
      ref.invalidate(orderDetailProvider(widget.orderId));
      ref.invalidate(myOrdersProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(accept ? 'تم قبول السعر — سيتم تخصيص سائق' : 'تم رفض السعر وإلغاء الطلب')),
      );
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Order> order = ref.watch(orderDetailProvider(widget.orderId));
    return Scaffold(
      appBar: AppBar(title: const Text('تفاصيل الطلب')),
      body: order.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (Object e, _) => Center(child: Text('$e')),
        data: (Order o) => ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            _statusHeader(o),
            const SizedBox(height: 16),
            _infoCard(o),
            if (o.awaitingCustomerDecision) ...<Widget>[
              const SizedBox(height: 16),
              _priceCard(o),
            ],
          ],
        ),
      ),
    );
  }

  Widget _statusHeader(Order o) {
    final Color color = StatusColor.of(o.status);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: <Widget>[
          Icon(Icons.circle, size: 12, color: color),
          const SizedBox(width: 8),
          Text(orderStatusArabic(o.status),
              style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _infoCard(Order o) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _row(Icons.warehouse, 'الاستلام', o.pickupAddress),
              const Divider(height: 20),
              _row(Icons.location_on, 'التسليم', o.deliveryAddress),
              const Divider(height: 20),
              _row(Icons.scale, 'الوزن', '${o.cargoWeightKg.toStringAsFixed(0)} كجم'),
              if (o.coldChainRequired) ...<Widget>[
                const Divider(height: 20),
                _row(Icons.ac_unit, 'التبريد',
                    o.temperatureType == 'FROZEN' ? 'مجمد' : 'مبرد'),
              ],
            ],
          ),
        ),
      );

  Widget _priceCard(Order o) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              const Text('عرض السعر', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              Text('${o.quotedPrice?.toStringAsFixed(2)} ${o.currency}',
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: EdhamColors.red)),
              const Text('غير شامل ضريبة القيمة المضافة (15%)',
                  style: TextStyle(color: EdhamColors.textMuted, fontSize: 12)),
              if (o.pricingNotes != null && o.pricingNotes!.isNotEmpty) ...<Widget>[
                const SizedBox(height: 8),
                Text(o.pricingNotes!, style: const TextStyle(color: EdhamColors.textMuted)),
              ],
              const SizedBox(height: 16),
              Row(
                children: <Widget>[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _busy ? null : () => _decide(accept: false),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(50),
                        side: const BorderSide(color: EdhamColors.textMuted),
                      ),
                      child: const Text('رفض', style: TextStyle(color: EdhamColors.black)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _busy ? null : () => _decide(accept: true),
                      child: _busy
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('قبول'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );

  Widget _row(IconData icon, String label, String value) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, size: 20, color: EdhamColors.textMuted),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(label, style: const TextStyle(color: EdhamColors.textMuted, fontSize: 12)),
              const SizedBox(height: 2),
              SizedBox(
                width: 260,
                child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ],
      );
}
