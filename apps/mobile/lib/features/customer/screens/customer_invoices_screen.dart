import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../models/invoice.dart';
import '../providers/orders_providers.dart';

class CustomerInvoicesScreen extends ConsumerWidget {
  const CustomerInvoicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Invoice>> invoices = ref.watch(myInvoicesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('فواتيري')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myInvoicesProvider),
        child: invoices.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (Object e, _) => Center(child: Text('$e')),
          data: (List<Invoice> list) => list.isEmpty
              ? ListView(children: const <Widget>[
                  SizedBox(height: 120),
                  Icon(Icons.receipt_long, size: 56, color: EdhamColors.textMuted),
                  SizedBox(height: 12),
                  Text('لا توجد فواتير', textAlign: TextAlign.center, style: TextStyle(color: EdhamColors.textMuted)),
                ])
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, int i) => _InvoiceCard(invoice: list[i]),
                ),
        ),
      ),
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  const _InvoiceCard({required this.invoice});

  final Invoice invoice;

  @override
  Widget build(BuildContext context) {
    final bool overdue = invoice.isOverdue;
    final Color color = overdue
        ? EdhamColors.red
        : invoice.status == 'PAID'
            ? EdhamColors.success
            : EdhamColors.black;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Text(invoice.invoiceNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(20)),
                  child: Text(overdue ? 'متأخرة' : invoice.statusArabic,
                      style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('${invoice.totalAmount.toStringAsFixed(2)} ${invoice.currency}',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: EdhamColors.red)),
            Text('شامل الضريبة (${invoice.vatAmount.toStringAsFixed(2)} ض.ق.م)',
                style: const TextStyle(color: EdhamColors.textMuted, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
