import 'package:edham_mobile/core/network/api_exception.dart';
import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/features/accountant/providers/accountant_providers.dart';
import 'package:edham_mobile/models/invoice.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

class AccountantInvoiceScreen extends ConsumerStatefulWidget {
  const AccountantInvoiceScreen({required this.invoiceId, super.key});

  final String invoiceId;

  @override
  ConsumerState<AccountantInvoiceScreen> createState() =>
      _AccountantInvoiceScreenState();
}

class _AccountantInvoiceScreenState
    extends ConsumerState<AccountantInvoiceScreen> {
  bool _busy = false;

  Future<void> _run(Future<Invoice> Function() action, String okMsg) async {
    setState(() => _busy = true);
    final ScaffoldMessengerState messenger = ScaffoldMessenger.of(context);
    try {
      await action();
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text(okMsg)));
      ref.invalidate(invoiceDetailProvider(widget.invoiceId));
      ref.invalidate(invoicesProvider);
    } on ApiException catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _send() {
    _run(
      () => ref.read(accountantRepositoryProvider).sendInvoice(widget.invoiceId),
      'تم إرسال الفاتورة للعميل',
    );
  }

  Future<void> _markPaid() async {
    final String? reference = await showDialog<String>(
      context: context,
      builder: (BuildContext ctx) => const _PaymentRefDialog(),
    );
    // إلغاء الحوار يرجّع null؛ التأكيد يرجّع نصاً (قد يكون فارغاً).
    if (reference == null) return;
    await _run(
      () => ref
          .read(accountantRepositoryProvider)
          .markPaid(widget.invoiceId, reference: reference),
      'تم تسجيل الدفع',
    );
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Invoice> invoice =
        ref.watch(invoiceDetailProvider(widget.invoiceId));

    return Scaffold(
      appBar: AppBar(title: const Text('تفاصيل الفاتورة')),
      body: invoice.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (Object e, _) => _ErrorView(
          message: e is ApiException ? e.message : '$e',
          onRetry: () =>
              ref.invalidate(invoiceDetailProvider(widget.invoiceId)),
        ),
        data: (Invoice inv) => _body(inv),
      ),
    );
  }

  Widget _body(Invoice inv) {
    return RefreshIndicator(
      onRefresh: () async =>
          ref.invalidate(invoiceDetailProvider(widget.invoiceId)),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(
                          inv.invoiceNumber,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                      ),
                      _StatusBadge(invoice: inv),
                    ],
                  ),
                  const Divider(height: 24),
                  _row('المبلغ الفرعي',
                      '${inv.subtotal.toStringAsFixed(2)} ${inv.currency}'),
                  _row('ضريبة القيمة المضافة (15%)',
                      '${inv.vatAmount.toStringAsFixed(2)} ${inv.currency}'),
                  const Divider(height: 24),
                  _row(
                    'الإجمالي',
                    '${inv.totalAmount.toStringAsFixed(2)} ${inv.currency}',
                    emphasize: true,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  _dateRow('تاريخ الإصدار', inv.issuedAt),
                  _dateRow('تاريخ الاستحقاق', inv.dueAt,
                      danger: inv.isOverdue),
                  _dateRow('تاريخ الدفع', inv.paidAt),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          ..._actions(inv),
        ],
      ),
    );
  }

  List<Widget> _actions(Invoice inv) {
    if (inv.status == 'DRAFT') {
      return <Widget>[
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _busy ? null : _send,
            icon: _busy
                ? const _BtnSpinner()
                : const Icon(Icons.send),
            label: const Text('إرسال للعميل'),
          ),
        ),
      ];
    }
    if (inv.status == 'SENT' || inv.status == 'OVERDUE') {
      return <Widget>[
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _busy ? null : _markPaid,
            icon: _busy
                ? const _BtnSpinner()
                : const Icon(Icons.check_circle_outline),
            label: const Text('تسجيل الدفع'),
          ),
        ),
      ];
    }
    return <Widget>[];
  }

  Widget _row(String label, String value, {bool emphasize = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          Text(label,
              style: TextStyle(
                color: emphasize ? EdhamColors.black : EdhamColors.textMuted,
                fontWeight: emphasize ? FontWeight.bold : FontWeight.normal,
                fontSize: emphasize ? 16 : 14,
              )),
          Text(value,
              style: TextStyle(
                fontWeight: emphasize ? FontWeight.bold : FontWeight.w600,
                fontSize: emphasize ? 18 : 14,
                color: emphasize ? EdhamColors.red : EdhamColors.black,
              )),
        ],
      ),
    );
  }

  Widget _dateRow(String label, DateTime? date, {bool danger = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          Text(label, style: const TextStyle(color: EdhamColors.textMuted)),
          Text(
            date == null ? '—' : DateFormat('yyyy/MM/dd').format(date),
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: danger ? EdhamColors.red : EdhamColors.black,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.invoice});

  final Invoice invoice;

  @override
  Widget build(BuildContext context) {
    final Color color =
        invoice.isOverdue ? EdhamColors.red : StatusColor.of(invoice.status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        invoice.statusArabic,
        style:
            TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _BtnSpinner extends StatelessWidget {
  const _BtnSpinner();

  @override
  Widget build(BuildContext context) => const SizedBox(
        width: 18,
        height: 18,
        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
      );
}

class _PaymentRefDialog extends StatefulWidget {
  const _PaymentRefDialog();

  @override
  State<_PaymentRefDialog> createState() => _PaymentRefDialogState();
}

class _PaymentRefDialogState extends State<_PaymentRefDialog> {
  final TextEditingController _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('تسجيل الدفع'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          TextField(
            controller: _controller,
            decoration: const InputDecoration(
              labelText: 'رقم المرجع (اختياري)',
              hintText: 'مثال: TRX-12345',
            ),
          ),
        ],
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('إلغاء'),
        ),
        ElevatedButton(
          onPressed: () =>
              Navigator.of(context).pop(_controller.text.trim()),
          child: const Text('تأكيد الدفع'),
        ),
      ],
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
