import 'package:edham_mobile/features/accountant/data/accountant_repository.dart';
import 'package:edham_mobile/features/auth/providers/auth_providers.dart';
import 'package:edham_mobile/models/invoice.dart';
import 'package:edham_mobile/models/order.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final accountantRepositoryProvider = Provider<AccountantRepository>(
  (Ref ref) => AccountantRepository(ref.watch(apiClientProvider)),
);

/// قائمة الفواتير (قابلة للتحديث).
final invoicesProvider = FutureProvider.autoDispose<List<Invoice>>(
  (Ref ref) => ref.watch(accountantRepositoryProvider).invoices(),
);

/// تفاصيل فاتورة واحدة.
final invoiceDetailProvider =
    FutureProvider.autoDispose.family<Invoice, String>(
  (Ref ref, String id) => ref.watch(accountantRepositoryProvider).getInvoice(id),
);

/// الطلبات المكتملة الجاهزة للفوترة.
final billableOrdersProvider = FutureProvider.autoDispose<List<Order>>(
  (Ref ref) => ref.watch(accountantRepositoryProvider).completedOrders(),
);
