import 'package:edham_mobile/core/network/api_exception.dart';
import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/features/workshop/providers/workshop_providers.dart';
import 'package:edham_mobile/models/fleet.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// أنواع الصيانة المتاحة.
const List<_MaintenanceType> _maintenanceTypes = <_MaintenanceType>[
  _MaintenanceType('ROUTINE', 'دورية'),
  _MaintenanceType('EMERGENCY', 'طارئة'),
  _MaintenanceType('INSPECTION', 'فحص'),
];

class _MaintenanceType {
  const _MaintenanceType(this.api, this.arabic);

  final String api;
  final String arabic;
}

class WorkshopNewRequestScreen extends ConsumerStatefulWidget {
  const WorkshopNewRequestScreen({super.key});

  @override
  ConsumerState<WorkshopNewRequestScreen> createState() => _WorkshopNewRequestScreenState();
}

class _WorkshopNewRequestScreenState extends ConsumerState<WorkshopNewRequestScreen> {
  final GlobalKey<FormState> _form = GlobalKey<FormState>();
  final TextEditingController _description = TextEditingController();

  String? _vehicleId;
  String _type = _maintenanceTypes.first.api;
  bool _busy = false;

  @override
  void dispose() {
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final String? vehicleId = _vehicleId;
    if (vehicleId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('اختر مركبة أولاً')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(workshopRepositoryProvider).createRequest(
            vehicleId: vehicleId,
            type: _type,
            description: _description.text.trim(),
          );
      ref.invalidate(maintenanceListProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم إنشاء طلب الصيانة')),
      );
      context.pop();
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

  String? _required(String? v) => (v == null || v.trim().isEmpty) ? 'حقل مطلوب' : null;

  @override
  Widget build(BuildContext context) {
    final AsyncValue<List<Vehicle>> vehicles = ref.watch(workshopVehiclesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('طلب صيانة جديد')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            const _SectionTitle('المركبة'),
            vehicles.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (Object e, _) => _InlineError(
                message: '$e',
                onRetry: () => ref.invalidate(workshopVehiclesProvider),
              ),
              data: (List<Vehicle> list) => list.isEmpty
                  ? const Text('لا توجد مركبات متاحة', style: TextStyle(color: EdhamColors.textMuted))
                  : DropdownButtonFormField<String>(
                      value: _vehicleId,
                      decoration: const InputDecoration(labelText: 'اختر المركبة'),
                      validator: (String? v) => v == null ? 'اختر مركبة' : null,
                      items: list
                          .map((Vehicle v) => DropdownMenuItem<String>(
                                value: v.id,
                                child: Text('${v.plateNumber} — ${v.statusArabic}'),
                              ))
                          .toList(),
                      onChanged: (String? v) => setState(() => _vehicleId = v),
                    ),
            ),
            const SizedBox(height: 20),
            const _SectionTitle('نوع الصيانة'),
            DropdownButtonFormField<String>(
              value: _type,
              decoration: const InputDecoration(labelText: 'النوع'),
              items: _maintenanceTypes
                  .map((_MaintenanceType t) => DropdownMenuItem<String>(
                        value: t.api,
                        child: Text(t.arabic),
                      ))
                  .toList(),
              onChanged: (String? v) => setState(() => _type = v ?? _type),
            ),
            const SizedBox(height: 20),
            const _SectionTitle('الوصف'),
            TextFormField(
              controller: _description,
              validator: _required,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'وصف المشكلة أو العمل المطلوب',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('إنشاء الطلب'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
      );
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(message, style: const TextStyle(color: EdhamColors.red)),
          TextButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
        ],
      );
}
