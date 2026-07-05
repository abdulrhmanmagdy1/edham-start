import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:edham_mobile/core/network/api_exception.dart';
import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/features/supervisor/data/supervisor_repository.dart';
import 'package:edham_mobile/features/supervisor/providers/supervisor_providers.dart';
import 'package:edham_mobile/models/enums.dart';
import 'package:edham_mobile/models/fleet.dart';
import 'package:edham_mobile/models/order.dart';

/// بيانات الإسناد (السائقون + المركبات المتاحة) مجمّعة.
class _AssignData {
  const _AssignData(this.drivers, this.vehicles);
  final List<Driver> drivers;
  final List<Vehicle> vehicles;
}

class SupervisorOrderScreen extends ConsumerStatefulWidget {
  const SupervisorOrderScreen({required this.orderId, super.key});

  final String orderId;

  @override
  ConsumerState<SupervisorOrderScreen> createState() => _SupervisorOrderScreenState();
}

class _SupervisorOrderScreenState extends ConsumerState<SupervisorOrderScreen> {
  final TextEditingController _priceCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();

  bool _busy = false;

  // حالة الإسناد.
  Future<_AssignData>? _assignFuture;
  String? _selectedDriverId;
  String? _selectedVehicleId;

  @override
  void dispose() {
    _priceCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  void _refresh() {
    ref.invalidate(supervisorOrderProvider(widget.orderId));
    _assignFuture = null;
    _selectedDriverId = null;
    _selectedVehicleId = null;
  }

  Future<_AssignData> _loadAssignData(Order o) async {
    final SupervisorRepository repo = ref.read(supervisorRepositoryProvider);
    final String? tempType = o.coldChainRequired ? o.temperatureType : null;
    final List<Driver> drivers = await repo.drivers();
    final List<Vehicle> vehicles = await repo.availableVehicles(temperatureType: tempType);
    return _AssignData(
      drivers.where((Driver d) => d.isAvailable).toList(),
      vehicles,
    );
  }

  Future<void> _submitPrice() async {
    final double? price = double.tryParse(_priceCtrl.text.trim());
    if (price == null || price <= 0) {
      _snack('أدخل سعراً صحيحاً');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(supervisorRepositoryProvider).setPrice(
            widget.orderId,
            price,
            pricingNotes: _notesCtrl.text.trim(),
          );
      if (!mounted) return;
      setState(_refresh);
      _snack('أُرسل السعر للعميل');
    } on ApiException catch (e) {
      _snack(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitAssign() async {
    if (_selectedDriverId == null || _selectedVehicleId == null) {
      _snack('اختر السائق والمركبة');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(supervisorRepositoryProvider).assign(
            widget.orderId,
            driverId: _selectedDriverId!,
            vehicleId: _selectedVehicleId!,
          );
      if (!mounted) return;
      setState(_refresh);
      _snack('تم إسناد السائق والمركبة');
    } on ApiException catch (e) {
      _snack(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Order> order = ref.watch(supervisorOrderProvider(widget.orderId));
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
            const SizedBox(height: 16),
            if (o.status == 'PENDING_PRICING') _pricingCard(),
            if (o.status == 'CUSTOMER_CONFIRMED') _assignCard(o),
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
              _row(Icons.category, 'نوع البضاعة', o.cargoType),
              const Divider(height: 20),
              _row(Icons.scale, 'الوزن', '${o.cargoWeightKg.toStringAsFixed(0)} كجم'),
              if (o.coldChainRequired) ...<Widget>[
                const Divider(height: 20),
                _row(Icons.ac_unit, 'التبريد',
                    o.temperatureType == 'FROZEN' ? 'مجمد' : 'مبرد'),
              ],
              if (o.quotedPrice != null) ...<Widget>[
                const Divider(height: 20),
                _row(Icons.sell, 'السعر المُدخل',
                    '${o.quotedPrice!.toStringAsFixed(2)} ${o.currency}'),
              ],
            ],
          ),
        ),
      );

  Widget _pricingCard() => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              const Text('تحديد السعر',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              TextField(
                controller: _priceCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: <TextInputFormatter>[
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                ],
                decoration: const InputDecoration(
                  labelText: 'السعر (ريال)',
                  prefixIcon: Icon(Icons.sell_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _notesCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'ملاحظات التسعير (اختياري)',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _busy ? null : _submitPrice,
                child: _busy
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('إرسال السعر للعميل'),
              ),
            ],
          ),
        ),
      );

  Widget _assignCard(Order o) {
    _assignFuture ??= _loadAssignData(o);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            const Text('إسناد سائق ومركبة',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            FutureBuilder<_AssignData>(
              future: _assignFuture,
              builder: (BuildContext context, AsyncSnapshot<_AssignData> snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                if (snap.hasError) {
                  final Object? err = snap.error;
                  final String msg = err is ApiException ? err.message : '$err';
                  return Text(msg, style: const TextStyle(color: EdhamColors.red));
                }
                final _AssignData data = snap.data!;
                if (data.drivers.isEmpty || data.vehicles.isEmpty) {
                  return const Text('لا يوجد سائقون أو مركبات متاحة حالياً',
                      style: TextStyle(color: EdhamColors.textMuted));
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    DropdownButtonFormField<String>(
                      value: _selectedVehicleId,
                      isExpanded: true,
                      decoration: const InputDecoration(labelText: 'المركبة'),
                      items: data.vehicles
                          .map((Vehicle v) => DropdownMenuItem<String>(
                                value: v.id,
                                child: Text('${v.plateNumber} — ${v.statusArabic}'),
                              ))
                          .toList(),
                      onChanged: _busy
                          ? null
                          : (String? v) => setState(() => _selectedVehicleId = v),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _selectedDriverId,
                      isExpanded: true,
                      decoration: const InputDecoration(labelText: 'السائق'),
                      items: data.drivers
                          .map((Driver d) => DropdownMenuItem<String>(
                                value: d.id,
                                child: Text('سائق ${d.employeeId}'),
                              ))
                          .toList(),
                      onChanged: _busy
                          ? null
                          : (String? v) => setState(() => _selectedDriverId = v),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _busy ? null : _submitAssign,
                      child: _busy
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2))
                          : const Text('إسناد'),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
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
