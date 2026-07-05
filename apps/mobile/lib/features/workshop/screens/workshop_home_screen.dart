import 'package:edham_mobile/core/theme/app_theme.dart';
import 'package:edham_mobile/features/auth/providers/auth_providers.dart';
import 'package:edham_mobile/features/workshop/providers/workshop_providers.dart';
import 'package:edham_mobile/models/maintenance.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// لون حالة طلب الصيانة.
Color maintenanceStatusColor(String status) {
  switch (status) {
    case 'OPEN':
      return EdhamColors.warning;
    case 'IN_PROGRESS':
      return EdhamColors.black;
    case 'COMPLETED':
      return EdhamColors.success;
    case 'CANCELLED':
      return EdhamColors.textMuted;
    default:
      return EdhamColors.textMuted;
  }
}

class WorkshopHomeScreen extends ConsumerWidget {
  const WorkshopHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<MaintenanceRequest>> requests = ref.watch(maintenanceListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('طلبات الصيانة'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'خروج',
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: EdhamColors.red,
        foregroundColor: Colors.white,
        onPressed: () => context.push('/workshop/new'),
        icon: const Icon(Icons.add),
        label: const Text('طلب صيانة جديد'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(maintenanceListProvider),
        child: requests.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (Object e, _) => _ErrorView(
            message: '$e',
            onRetry: () => ref.invalidate(maintenanceListProvider),
          ),
          data: (List<MaintenanceRequest> list) => list.isEmpty
              ? _empty()
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, int i) => _RequestCard(request: list[i]),
                ),
        ),
      ),
    );
  }

  Widget _empty() => ListView(
        children: const <Widget>[
          SizedBox(height: 120),
          Icon(Icons.build_outlined, size: 64, color: EdhamColors.textMuted),
          SizedBox(height: 12),
          Text('لا توجد طلبات صيانة',
              textAlign: TextAlign.center, style: TextStyle(color: EdhamColors.textMuted)),
          SizedBox(height: 4),
          Text('اضغط "طلب صيانة جديد" للبدء',
              textAlign: TextAlign.center, style: TextStyle(color: EdhamColors.textMuted)),
        ],
      );
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({required this.request});

  final MaintenanceRequest request;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/workshop/maintenance/${request.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      request.typeArabic,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  _StatusBadge(status: request.status, label: request.statusArabic),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: <Widget>[
                  const Icon(Icons.directions_car, size: 16, color: EdhamColors.textMuted),
                  const SizedBox(width: 4),
                  Text(
                    request.vehiclePlate ?? 'مركبة غير محددة',
                    style: const TextStyle(color: EdhamColors.textMuted),
                  ),
                ],
              ),
              if (request.description.isNotEmpty) ...<Widget>[
                const SizedBox(height: 8),
                Text(
                  request.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: EdhamColors.textMuted, fontSize: 13),
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
  const _StatusBadge({required this.status, required this.label});

  final String status;
  final String label;

  @override
  Widget build(BuildContext context) {
    final Color color = maintenanceStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
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
