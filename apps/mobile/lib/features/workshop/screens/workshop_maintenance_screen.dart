import 'package:edham_mobile/core/network/api_exception.dart';
import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/features/workshop/providers/workshop_providers.dart';
import 'package:edham_mobile/features/workshop/screens/workshop_home_screen.dart';
import 'package:edham_mobile/models/maintenance.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class WorkshopMaintenanceScreen extends ConsumerStatefulWidget {
  const WorkshopMaintenanceScreen({required this.requestId, super.key});

  final String requestId;

  @override
  ConsumerState<WorkshopMaintenanceScreen> createState() => _WorkshopMaintenanceScreenState();
}

class _WorkshopMaintenanceScreenState extends ConsumerState<WorkshopMaintenanceScreen> {
  bool _busy = false;

  Future<void> _updateStatus(String status, {double? cost}) async {
    setState(() => _busy = true);
    try {
      await ref.read(workshopRepositoryProvider).updateStatus(
            widget.requestId,
            status: status,
            cost: cost,
          );
      ref.invalidate(maintenanceDetailProvider(widget.requestId));
      ref.invalidate(maintenanceListProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تحديث الحالة')),
      );
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('حدث خطأ غير متوقع')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _completeWithCost() async {
    final double? cost = await _askCost();
    if (cost == null) return;
    await _updateStatus('COMPLETED', cost: cost);
  }

  Future<double?> _askCost() async {
    final TextEditingController controller = TextEditingController();
    final double? result = await showDialog<double>(
      context: context,
      builder: (BuildContext ctx) {
        return AlertDialog(
          title: const Text('تكلفة الصيانة'),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            autofocus: true,
            decoration: const InputDecoration(labelText: 'التكلفة (ريال)'),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () {
                final double value = double.tryParse(controller.text.trim()) ?? 0;
                Navigator.of(ctx).pop(value);
              },
              child: const Text('إكمال'),
            ),
          ],
        );
      },
    );
    controller.dispose();
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<MaintenanceRequest> request =
        ref.watch(maintenanceDetailProvider(widget.requestId));

    return Scaffold(
      appBar: AppBar(title: const Text('تفاصيل الصيانة')),
      body: request.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (Object e, _) => Center(child: Text('$e')),
        data: (MaintenanceRequest r) => ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            _statusHeader(r),
            const SizedBox(height: 16),
            _infoCard(r),
            const SizedBox(height: 16),
            _actions(r),
          ],
        ),
      ),
    );
  }

  Widget _statusHeader(MaintenanceRequest r) {
    final Color color = maintenanceStatusColor(r.status);
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
          Text(
            r.statusArabic,
            style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _infoCard(MaintenanceRequest r) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _row(Icons.directions_car, 'المركبة', r.vehiclePlate ?? 'غير محددة'),
              const Divider(height: 20),
              _row(Icons.build, 'نوع الصيانة', r.typeArabic),
              const Divider(height: 20),
              _row(Icons.description, 'الوصف', r.description.isEmpty ? '—' : r.description),
              if (r.cost != null) ...<Widget>[
                const Divider(height: 20),
                _row(Icons.attach_money, 'التكلفة', '${r.cost!.toStringAsFixed(2)} ريال'),
              ],
            ],
          ),
        ),
      );

  Widget _actions(MaintenanceRequest r) {
    if (r.status == 'OPEN') {
      return ElevatedButton.icon(
        onPressed: _busy ? null : () => _updateStatus('IN_PROGRESS'),
        icon: const Icon(Icons.play_arrow),
        label: _busy
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : const Text('بدء التنفيذ'),
      );
    }
    if (r.status == 'IN_PROGRESS') {
      return ElevatedButton.icon(
        onPressed: _busy ? null : _completeWithCost,
        icon: const Icon(Icons.check),
        label: _busy
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : const Text('إكمال'),
      );
    }
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: EdhamColors.black.withOpacity(0.04),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Row(
        children: <Widget>[
          Icon(Icons.info_outline, size: 18, color: EdhamColors.textMuted),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'لا توجد إجراءات متاحة لهذه الحالة',
              style: TextStyle(color: EdhamColors.textMuted, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, size: 20, color: EdhamColors.textMuted),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(label, style: const TextStyle(color: EdhamColors.textMuted, fontSize: 12)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      );
}
