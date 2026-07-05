import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/enums.dart';
import '../providers/orders_providers.dart';

class CreateOrderScreen extends ConsumerStatefulWidget {
  const CreateOrderScreen({super.key});

  @override
  ConsumerState<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends ConsumerState<CreateOrderScreen> {
  final GlobalKey<FormState> _form = GlobalKey<FormState>();
  final TextEditingController _pickup = TextEditingController(text: 'مستودع الرياض');
  final TextEditingController _delivery = TextEditingController();
  final TextEditingController _city = TextEditingController();
  final TextEditingController _weight = TextEditingController();

  CargoType _cargo = CargoType.dry;
  VehicleType _vehicle = VehicleType.hiaceVan;
  bool _coldChain = false;
  TemperatureType _temp = TemperatureType.refrigerated;
  DateTime _scheduledAt = DateTime.now().add(const Duration(days: 1));
  bool _busy = false;

  // TODO(Phase 2): استبدال الإحداثيات الثابتة بمنتقي خريطة (Google Maps).
  static const double _pickupLat = 24.7136;
  static const double _pickupLng = 46.6753;
  static const double _dropLat = 21.4858;
  static const double _dropLng = 39.1925;

  @override
  void dispose() {
    _pickup.dispose();
    _delivery.dispose();
    _city.dispose();
    _weight.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final DateTime now = DateTime.now();
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _scheduledAt,
      firstDate: now,
      lastDate: now.add(const Duration(days: 7)),
    );
    if (picked != null) setState(() => _scheduledAt = picked);
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    final Map<String, dynamic> payload = <String, dynamic>{
      'pickup': <String, dynamic>{'address': _pickup.text.trim(), 'lat': _pickupLat, 'lng': _pickupLng},
      'stops': <Map<String, dynamic>>[
        <String, dynamic>{
          'sequenceNumber': 1,
          'address': _delivery.text.trim(),
          'city': _city.text.trim().isEmpty ? null : _city.text.trim(),
          'lat': _dropLat,
          'lng': _dropLng,
        },
      ],
      'vehicleTypeRequired': _vehicle.api,
      'cargoType': _cargo.api,
      'cargoWeightKg': double.tryParse(_weight.text.trim()) ?? 0,
      'coldChainRequired': _coldChain,
      if (_coldChain) 'temperatureType': _temp.api,
      'scheduledAt': _scheduledAt.toUtc().toIso8601String(),
    };

    try {
      await ref.read(ordersRepositoryProvider).createOrder(payload);
      ref.invalidate(myOrdersProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم إرسال الطلب — بانتظار التسعير من المشرف')),
      );
      context.pop();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('حدث خطأ غير متوقع')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String? _required(String? v) => (v == null || v.trim().isEmpty) ? 'حقل مطلوب' : null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('طلب شحن جديد')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            const _SectionTitle('نقطة الاستلام'),
            TextFormField(
              controller: _pickup,
              validator: _required,
              decoration: const InputDecoration(labelText: 'عنوان الاستلام'),
            ),
            const SizedBox(height: 20),
            const _SectionTitle('وجهة التسليم'),
            TextFormField(
              controller: _delivery,
              validator: _required,
              decoration: const InputDecoration(labelText: 'عنوان التسليم'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _city,
              decoration: const InputDecoration(labelText: 'المدينة (اختياري)'),
            ),
            const SizedBox(height: 20),
            const _SectionTitle('تفاصيل الشحنة'),
            DropdownButtonFormField<CargoType>(
              value: _cargo,
              decoration: const InputDecoration(labelText: 'نوع البضاعة'),
              items: CargoType.values
                  .map((CargoType c) => DropdownMenuItem<CargoType>(value: c, child: Text(c.arabic)))
                  .toList(),
              onChanged: (CargoType? v) => setState(() => _cargo = v ?? _cargo),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<VehicleType>(
              value: _vehicle,
              decoration: const InputDecoration(labelText: 'نوع المركبة المطلوبة'),
              items: VehicleType.values
                  .map((VehicleType v) => DropdownMenuItem<VehicleType>(value: v, child: Text(v.arabic)))
                  .toList(),
              onChanged: (VehicleType? v) => setState(() => _vehicle = v ?? _vehicle),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _weight,
              keyboardType: TextInputType.number,
              validator: (String? v) =>
                  (double.tryParse(v?.trim() ?? '') ?? 0) > 0 ? null : 'أدخل وزناً صحيحاً',
              decoration: const InputDecoration(labelText: 'الوزن (كجم)'),
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              value: _coldChain,
              activeColor: EdhamColors.red,
              contentPadding: EdgeInsets.zero,
              title: const Text('شحنة مبردة/مجمدة (سلسلة تبريد)'),
              onChanged: (bool v) => setState(() => _coldChain = v),
            ),
            if (_coldChain)
              DropdownButtonFormField<TemperatureType>(
                value: _temp,
                decoration: const InputDecoration(labelText: 'نوع التبريد'),
                items: TemperatureType.values
                    .map((TemperatureType t) =>
                        DropdownMenuItem<TemperatureType>(value: t, child: Text(t.arabic)))
                    .toList(),
                onChanged: (TemperatureType? v) => setState(() => _temp = v ?? _temp),
              ),
            const SizedBox(height: 20),
            const _SectionTitle('موعد الاستلام'),
            OutlinedButton.icon(
              onPressed: _pickDate,
              icon: const Icon(Icons.calendar_today, size: 18),
              label: Text('${_scheduledAt.year}/${_scheduledAt.month}/${_scheduledAt.day}'),
            ),
            const SizedBox(height: 24),
            Container(
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
                      'لن يظهر أي سعر الآن. يراجع المشرف طلبك ويرسل لك السعر للموافقة.',
                      style: TextStyle(color: EdhamColors.textMuted, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('إرسال طلب الشحن'),
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
