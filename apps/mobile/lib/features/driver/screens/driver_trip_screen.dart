import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import 'package:edham_mobile/core/network/api_exception.dart';
import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/features/driver/data/driver_repository.dart';
import 'package:edham_mobile/features/driver/providers/driver_providers.dart';
import 'package:edham_mobile/features/driver/screens/driver_widgets.dart';
import 'package:edham_mobile/models/trip.dart';

class DriverTripScreen extends ConsumerStatefulWidget {
  const DriverTripScreen({required this.tripId, super.key});

  final String tripId;

  @override
  ConsumerState<DriverTripScreen> createState() => _DriverTripScreenState();
}

class _DriverTripScreenState extends ConsumerState<DriverTripScreen> {
  bool _busy = false;

  bool _isOffline(ApiException e) => e.statusCode == null;

  void _refresh() {
    ref.invalidate(tripDetailProvider(widget.tripId));
    ref.invalidate(tripStopsProvider(widget.tripId));
    ref.invalidate(myTripsProvider);
    ref.invalidate(activeTripProvider);
  }

  void _showSnack(String message, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: error ? EdhamColors.red : EdhamColors.black,
      ),
    );
  }

  // ---- الإجراءات ----

  Future<void> _confirmLoading() async {
    await _guarded(() async {
      await ref.read(driverRepositoryProvider).confirmLoading(widget.tripId);
      _refresh();
      _showSnack('تم تأكيد التحميل');
    });
  }

  Future<void> _startTrip() async {
    await _guarded(() async {
      await ref.read(driverRepositoryProvider).startTrip(widget.tripId);
      _refresh();
      _showSnack('تم بدء الرحلة');
    });
  }

  Future<void> _deliverStop(TripStop stop) async {
    final _DeliverResult? result = await showDialog<_DeliverResult>(
      context: context,
      builder: (_) => _DeliverDialog(stop: stop),
    );
    if (result == null) return;

    final DriverRepository repo = ref.read(driverRepositoryProvider);
    setState(() => _busy = true);
    try {
      await repo.deliverStop(
        widget.tripId,
        stop.id,
        recipientName: result.recipientName,
        podPhotoUrl: result.podPhotoUrl,
      );
      _refresh();
      _showSnack('تم تسليم المحطة');
    } on ApiException catch (e) {
      if (_isOffline(e)) {
        await ref.read(offlineQueueProvider).enqueueDeliver(
              tripId: widget.tripId,
              stopId: stop.id,
              recipientName: result.recipientName,
              podPhotoUrl: result.podPhotoUrl,
            );
        _showSnack('لا يوجد اتصال — سيُزامَن التسليم عند عودة الاتصال');
      } else {
        _showSnack(e.message, error: true);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _logTemperature() async {
    final double? celsius = await showDialog<double>(
      context: context,
      builder: (_) => const _TemperatureDialog(),
    );
    if (celsius == null) return;

    final DriverRepository repo = ref.read(driverRepositoryProvider);
    setState(() => _busy = true);
    try {
      final Map<String, dynamic> res = await repo.logTemperature(widget.tripId, celsius);
      final bool violation = res['isViolation'] == true;
      if (violation) {
        _showSnack('تحذير: القراءة (${celsius.toStringAsFixed(1)}°) خارج النطاق الآمن!', error: true);
      } else {
        _showSnack('تم تسجيل درجة الحرارة');
      }
    } on ApiException catch (e) {
      if (_isOffline(e)) {
        await ref.read(offlineQueueProvider).enqueueTemperature(
              tripId: widget.tripId,
              temperatureCelsius: celsius,
            );
        _showSnack('لا يوجد اتصال — ستُزامَن القراءة عند عودة الاتصال');
      } else {
        _showSnack(e.message, error: true);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _sendLocation() async {
    setState(() => _busy = true);
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        _showSnack('تم رفض إذن الموقع — فعّله من إعدادات الجهاز', error: true);
        return;
      }

      final Position pos = await Geolocator.getCurrentPosition();
      final List<Map<String, dynamic>> points = <Map<String, dynamic>>[
        <String, dynamic>{
          'lat': pos.latitude,
          'lng': pos.longitude,
          'recordedAt': DateTime.now().toUtc().toIso8601String(),
        },
      ];

      try {
        await ref.read(driverRepositoryProvider).sendLocations(widget.tripId, points);
        _showSnack('تم إرسال موقعك الحالي');
      } on ApiException catch (e) {
        if (_isOffline(e)) {
          await ref.read(offlineQueueProvider).enqueueLocation(tripId: widget.tripId, points: points);
          _showSnack('لا يوجد اتصال — سيُزامَن الموقع عند عودة الاتصال');
        } else {
          _showSnack(e.message, error: true);
        }
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reportIssue() async {
    final String? description = await showDialog<String>(
      context: context,
      builder: (_) => const _ReportIssueDialog(),
    );
    if (description == null || description.isEmpty) return;

    await _guarded(() async {
      await ref.read(driverRepositoryProvider).reportIssue(widget.tripId, description);
      _showSnack('تم إرسال البلاغ');
    });
  }

  Future<void> _syncPending() async {
    setState(() => _busy = true);
    try {
      final int synced = await ref.read(offlineQueueProvider).syncPending(
            ref.read(driverRepositoryProvider),
          );
      _refresh();
      _showSnack(synced == 0 ? 'لا توجد عمليات للمزامنة' : 'تمّت مزامنة $synced عملية');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// غلاف موحّد للإجراءات التي لا تدخل الطابور offline.
  Future<void> _guarded(Future<void> Function() action) async {
    setState(() => _busy = true);
    try {
      await action();
    } on ApiException catch (e) {
      _showSnack(e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ---- الواجهة ----

  @override
  Widget build(BuildContext context) {
    final AsyncValue<Trip> trip = ref.watch(tripDetailProvider(widget.tripId));
    final AsyncValue<List<TripStop>> stops = ref.watch(tripStopsProvider(widget.tripId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('تفاصيل الرحلة'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'مزامنة',
            onPressed: _busy ? null : _syncPending,
          ),
        ],
      ),
      body: trip.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (Object e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('$e', textAlign: TextAlign.center),
          ),
        ),
        data: (Trip t) => Stack(
          children: <Widget>[
            RefreshIndicator(
              onRefresh: () async => _refresh(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: <Widget>[
                  _header(t),
                  const SizedBox(height: 16),
                  _stopsSection(t, stops),
                  const SizedBox(height: 24),
                  _actionsSection(t),
                  const SizedBox(height: 32),
                ],
              ),
            ),
            if (_busy)
              const ColoredBox(
                color: Color(0x33000000),
                child: Center(child: CircularProgressIndicator()),
              ),
          ],
        ),
      ),
    );
  }

  Widget _header(Trip t) {
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
                    'رحلة #${t.orderId}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
                TripStatusBadge(status: t.status),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: <Widget>[
                const Icon(Icons.place_outlined, size: 16, color: EdhamColors.textMuted),
                const SizedBox(width: 4),
                Text('${t.totalStops} محطة',
                    style: const TextStyle(color: EdhamColors.textMuted)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _stopsSection(Trip t, AsyncValue<List<TripStop>> stops) {
    final bool inProgress = t.status == 'IN_PROGRESS' || t.status == 'AT_STOP';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        const Text('المحطات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 8),
        stops.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (Object e, _) => Text('$e', style: const TextStyle(color: EdhamColors.red)),
          data: (List<TripStop> list) {
            if (list.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text('لا توجد محطات', style: TextStyle(color: EdhamColors.textMuted)),
              );
            }
            return Column(
              children: list
                  .map((TripStop s) => _StopTile(
                        stop: s,
                        canDeliver: inProgress && !s.delivered && !_busy,
                        onDeliver: () => _deliverStop(s),
                      ))
                  .toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _actionsSection(Trip t) {
    final bool canConfirmLoading = t.status == 'ASSIGNED';
    final bool canStart = t.status == 'LOADING';
    final List<Widget> buttons = <Widget>[];

    if (canConfirmLoading) {
      buttons.add(_primaryButton(
        icon: Icons.inventory_2,
        label: 'وصلت لنقطة التحميل / تم التحميل',
        onPressed: _confirmLoading,
      ));
    }
    if (canStart) {
      buttons.add(_primaryButton(
        icon: Icons.play_arrow,
        label: 'بدء الرحلة',
        onPressed: _startTrip,
      ));
    }

    if (t.isActive) {
      buttons.addAll(<Widget>[
        _secondaryButton(
          icon: Icons.thermostat,
          label: 'تسجيل درجة حرارة',
          onPressed: _logTemperature,
        ),
        _secondaryButton(
          icon: Icons.my_location,
          label: 'إرسال موقعي (GPS)',
          onPressed: _sendLocation,
        ),
        _secondaryButton(
          icon: Icons.report_problem,
          label: 'الإبلاغ عن مشكلة',
          onPressed: _reportIssue,
        ),
      ]);
    }

    if (buttons.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        const Text('الإجراءات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 8),
        ...buttons,
      ],
    );
  }

  Widget _primaryButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ElevatedButton.icon(
        onPressed: _busy ? null : onPressed,
        icon: Icon(icon),
        label: Text(label),
      ),
    );
  }

  Widget _secondaryButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: OutlinedButton.icon(
        onPressed: _busy ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: EdhamColors.black,
          minimumSize: const Size.fromHeight(50),
          side: const BorderSide(color: EdhamColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        icon: Icon(icon),
        label: Text(label),
      ),
    );
  }
}

// ---- عناصر داخلية ----

class _StopTile extends StatelessWidget {
  const _StopTile({
    required this.stop,
    required this.canDeliver,
    required this.onDeliver,
  });

  final TripStop stop;
  final bool canDeliver;
  final VoidCallback onDeliver;

  @override
  Widget build(BuildContext context) {
    final Color statusColor = stop.delivered ? EdhamColors.success : EdhamColors.warning;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                CircleAvatar(
                  radius: 14,
                  backgroundColor: statusColor.withOpacity(0.15),
                  child: Text('${stop.sequenceNumber}',
                      style: TextStyle(color: statusColor, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(stop.address,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      if (stop.city != null || stop.contactName != null)
                        Text(
                          <String>[
                            if (stop.city != null) stop.city!,
                            if (stop.contactName != null) stop.contactName!,
                          ].join(' — '),
                          style: const TextStyle(color: EdhamColors.textMuted, fontSize: 13),
                        ),
                    ],
                  ),
                ),
                Icon(
                  stop.delivered ? Icons.check_circle : Icons.radio_button_unchecked,
                  color: statusColor,
                ),
              ],
            ),
            if (canDeliver) ...<Widget>[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onDeliver,
                  style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(44)),
                  icon: const Icon(Icons.done_all, size: 18),
                  label: const Text('تسليم المحطة'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// نتيجة حوار التسليم.
class _DeliverResult {
  const _DeliverResult({this.recipientName, this.podPhotoUrl});

  final String? recipientName;
  final String? podPhotoUrl;
}

class _DeliverDialog extends StatefulWidget {
  const _DeliverDialog({required this.stop});

  final TripStop stop;

  @override
  State<_DeliverDialog> createState() => _DeliverDialogState();
}

class _DeliverDialogState extends State<_DeliverDialog> {
  final TextEditingController _recipient = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  Uint8List? _photoBytes; // معاينة الصورة
  String? _photoDataUri; // تُرسل للخادم
  bool _capturing = false;

  @override
  void initState() {
    super.initState();
    if (widget.stop.contactName != null) {
      _recipient.text = widget.stop.contactName!;
    }
  }

  @override
  void dispose() {
    _recipient.dispose();
    super.dispose();
  }

  /// التقاط صورة إثبات التسليم (مضغوطة) وتحويلها إلى data URI.
  Future<void> _capture(ImageSource source) async {
    setState(() => _capturing = true);
    try {
      final XFile? file = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        imageQuality: 55, // ضغط لتقليل الحجم المُرسل
      );
      if (file == null) return;
      final Uint8List bytes = await file.readAsBytes();
      if (!mounted) return;
      setState(() {
        _photoBytes = bytes;
        _photoDataUri = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      });
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تعذّر التقاط الصورة')),
        );
      }
    } finally {
      if (mounted) setState(() => _capturing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('تسليم المحطة ${widget.stop.sequenceNumber}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          TextField(
            controller: _recipient,
            decoration: const InputDecoration(labelText: 'اسم المستلم'),
          ),
          const SizedBox(height: 12),
          if (_photoBytes != null) ...<Widget>[
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.memory(_photoBytes!, height: 120, fit: BoxFit.cover),
            ),
            const SizedBox(height: 8),
          ],
          Row(
            children: <Widget>[
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _capturing ? null : () => _capture(ImageSource.camera),
                  icon: Icon(_photoBytes != null ? Icons.check : Icons.camera_alt),
                  label: Text(_photoBytes != null ? 'إعادة الالتقاط' : 'كاميرا'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _capturing ? null : () => _capture(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library),
                  label: const Text('من المعرض'),
                ),
              ),
            ],
          ),
        ],
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('إلغاء'),
        ),
        ElevatedButton(
          onPressed: () {
            final String name = _recipient.text.trim();
            Navigator.of(context).pop(_DeliverResult(
              recipientName: name.isEmpty ? null : name,
              podPhotoUrl: _photoDataUri,
            ));
          },
          child: const Text('تأكيد التسليم'),
        ),
      ],
    );
  }
}

class _TemperatureDialog extends StatefulWidget {
  const _TemperatureDialog();

  @override
  State<_TemperatureDialog> createState() => _TemperatureDialogState();
}

class _TemperatureDialogState extends State<_TemperatureDialog> {
  final TextEditingController _value = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _value.dispose();
    super.dispose();
  }

  void _submit() {
    final double? parsed = double.tryParse(_value.text.trim());
    if (parsed == null) {
      setState(() => _error = 'أدخل رقماً صحيحاً');
      return;
    }
    Navigator.of(context).pop(parsed);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('تسجيل درجة الحرارة'),
      content: TextField(
        controller: _value,
        keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
        decoration: InputDecoration(
          labelText: 'الحرارة (°C)',
          errorText: _error,
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('إلغاء'),
        ),
        ElevatedButton(onPressed: _submit, child: const Text('تسجيل')),
      ],
    );
  }
}

class _ReportIssueDialog extends StatefulWidget {
  const _ReportIssueDialog();

  @override
  State<_ReportIssueDialog> createState() => _ReportIssueDialogState();
}

class _ReportIssueDialogState extends State<_ReportIssueDialog> {
  final TextEditingController _desc = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _desc.dispose();
    super.dispose();
  }

  void _submit() {
    final String text = _desc.text.trim();
    if (text.isEmpty) {
      setState(() => _error = 'اكتب وصف المشكلة');
      return;
    }
    Navigator.of(context).pop(text);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('الإبلاغ عن مشكلة'),
      content: TextField(
        controller: _desc,
        maxLines: 3,
        decoration: InputDecoration(
          labelText: 'وصف المشكلة',
          errorText: _error,
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('إلغاء'),
        ),
        ElevatedButton(onPressed: _submit, child: const Text('إرسال')),
      ],
    );
  }
}
