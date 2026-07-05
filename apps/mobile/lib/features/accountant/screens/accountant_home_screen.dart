import 'package:edham_mobile/core/network/api_exception.dart';
import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/features/accountant/providers/accountant_providers.dart';
import 'package:edham_mobile/features/auth/providers/auth_providers.dart';
import 'package:edham_mobile/models/enums.dart';
import 'package:edham_mobile/models/invoice.dart';
import 'package:edham_mobile/models/order.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class AccountantHomeScreen extends ConsumerStatefulWidget {
  const AccountantHomeScreen({super.key});

  @override
  ConsumerState<AccountantHomeScreen> createState() =>
      _AccountantHomeScreenState();
}

class _AccountantHomeScreenState extends ConsumerState<AccountantHomeScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('المحاسبة'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'خروج',
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: EdhamColors.red,
          tabs: const <Widget>[
            Tab(text: 'الفواتير'),
            Tab(text: 'جاهزة للفوترة'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: const <Widget>[
          _InvoicesTab(),
          _BillableTab(),
        ],
      ),
    );
  }
}

// ─────────────────────────── تبويب الفواتير ───────────────────────────

class _InvoicesTab extends ConsumerWidget {
  const _InvoicesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Invoice>> invoices = ref.watch(invoicesProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(invoicesProvider),
      child: invoices.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (Object e, _) => _ErrorView(
          message: e is ApiException ? e.message : '$e',
          onRetry: () => ref.invalidate(invoicesProvider),
        ),
        data: (List<Invoice> list) => list.isEmpty
            ? _empty('لا توجد فواتير بعد', Icons.receipt_long_outlined)
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, int i) => _InvoiceCard(invoice: list[i]),
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
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/accountant/invoices/${invoice.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      invoice.invoiceNumber,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 16),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  _StatusBadge(invoice: invoice),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: <Widget>[
                  const Icon(Icons.payments_outlined,
                      size: 16, color: EdhamColors.textMuted),
                  const SizedBox(width: 4),
                  Text(
                    '${invoice.totalAmount.toStringAsFixed(2)} ${invoice.currency}',
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ],
              ),
              if (overdue && invoice.dueAt != null) ...<Widget>[
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: EdhamColors.red.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'متأخرة — استحقاق ${_fmtDate(invoice.dueAt!)}',
                    style: const TextStyle(
                        color: EdhamColors.red, fontWeight: FontWeight.w600),
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
  const _StatusBadge({required this.invoice});

  final Invoice invoice;

  @override
  Widget build(BuildContext context) {
    final Color color = invoice.isOverdue
        ? EdhamColors.red
        : StatusColor.of(invoice.status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        invoice.statusArabic,
        style:
            TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

// ─────────────────────────── تبويب الجاهزة للفوترة ───────────────────────────

class _BillableTab extends ConsumerStatefulWidget {
  const _BillableTab();

  @override
  ConsumerState<_BillableTab> createState() => _BillableTabState();
}

class _BillableTabState extends ConsumerState<_BillableTab> {
  final Set<String> _busy = <String>{};

  Future<void> _create(Order order) async {
    setState(() => _busy.add(order.id));
    final ScaffoldMessengerState messenger = ScaffoldMessenger.of(context);
    try {
      final Invoice invoice =
          await ref.read(accountantRepositoryProvider).createInvoice(order.id);
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(content: Text('تم إنشاء الفاتورة ${invoice.invoiceNumber}')),
      );
      ref.invalidate(billableOrdersProvider);
      ref.invalidate(invoicesProvider);
    } on ApiException catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy.remove(order.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<List<Order>> orders = ref.watch(billableOrdersProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(billableOrdersProvider),
      child: orders.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (Object e, _) => _ErrorView(
          message: e is ApiException ? e.message : '$e',
          onRetry: () => ref.invalidate(billableOrdersProvider),
        ),
        data: (List<Order> list) => list.isEmpty
            ? _empty('لا توجد طلبات جاهزة للفوترة', Icons.task_alt_outlined)
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, int i) => _BillableCard(
                  order: list[i],
                  busy: _busy.contains(list[i].id),
                  onCreate: () => _create(list[i]),
                ),
              ),
      ),
    );
  }
}

class _BillableCard extends StatelessWidget {
  const _BillableCard({
    required this.order,
    required this.busy,
    required this.onCreate,
  });

  final Order order;
  final bool busy;
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    '${order.pickupAddress} ← ${order.deliveryAddress}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 15),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: EdhamColors.success.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    orderStatusArabic(order.status),
                    style: const TextStyle(
                        color: EdhamColors.success,
                        fontSize: 12,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: <Widget>[
                const Icon(Icons.scale, size: 16, color: EdhamColors.textMuted),
                const SizedBox(width: 4),
                Text('${order.cargoWeightKg.toStringAsFixed(0)} كجم',
                    style: const TextStyle(color: EdhamColors.textMuted)),
                if (order.quotedPrice != null) ...<Widget>[
                  const SizedBox(width: 16),
                  const Icon(Icons.payments_outlined,
                      size: 16, color: EdhamColors.textMuted),
                  const SizedBox(width: 4),
                  Text(
                    '${order.quotedPrice!.toStringAsFixed(0)} ${order.currency}',
                    style: const TextStyle(color: EdhamColors.textMuted),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: busy ? null : onCreate,
                icon: busy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.receipt_long),
                label: Text(busy ? 'جارٍ الإنشاء…' : 'إنشاء فاتورة'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────── مشترك ───────────────────────────

String _fmtDate(DateTime d) => DateFormat('yyyy/MM/dd').format(d);

Widget _empty(String message, IconData icon) => ListView(
      children: <Widget>[
        const SizedBox(height: 120),
        Icon(icon, size: 64, color: EdhamColors.textMuted),
        const SizedBox(height: 12),
        Text(message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: EdhamColors.textMuted)),
      ],
    );

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
        Center(
          child: TextButton(
              onPressed: onRetry, child: const Text('إعادة المحاولة')),
        ),
      ],
    );
  }
}
