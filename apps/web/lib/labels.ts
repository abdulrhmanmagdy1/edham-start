import { UserRole } from '@edham/shared-types';

export function orderStatusArabic(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'مسودة',
    PENDING_PRICING: 'بانتظار التسعير',
    PRICED: 'بانتظار موافقة العميل',
    CUSTOMER_CONFIRMED: 'مؤكّد — للإسناد',
    ASSIGNED: 'تم الإسناد',
    LOADING: 'جاري التحميل',
    IN_TRANSIT: 'في الطريق',
    DELIVERED: 'تم التسليم',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغى',
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  switch (status) {
    case 'PENDING_PRICING':
    case 'OPEN':
      return 'bg-amber-100 text-amber-700';
    case 'PRICED':
    case 'OVERDUE':
      return 'bg-red-100 text-red-700';
    case 'COMPLETED':
    case 'PAID':
    case 'DELIVERED':
    case 'AVAILABLE':
      return 'bg-green-100 text-green-700';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-neutral-900 text-white';
  }
}

export function roleArabic(role: string): string {
  const map: Record<UserRole, string> = {
    [UserRole.CUSTOMER]: 'عميل',
    [UserRole.DRIVER]: 'سائق',
    [UserRole.SUPERVISOR]: 'مشرف',
    [UserRole.ACCOUNTANT]: 'محاسب',
    [UserRole.WORKSHOP]: 'ورشة',
  };
  return map[role as UserRole] ?? role;
}

export function invoiceStatusArabic(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'مسودة',
    SENT: 'مُرسَلة',
    PAID: 'مدفوعة',
    OVERDUE: 'متأخرة',
    CANCELLED: 'ملغاة',
  };
  return map[status] ?? status;
}

export function maintenanceStatusArabic(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'مفتوح',
    IN_PROGRESS: 'قيد التنفيذ',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغى',
  };
  return map[status] ?? status;
}

export function vehicleTypeArabic(type: string): string {
  const map: Record<string, string> = {
    HIACE_VAN: 'فان (هايس)',
    ISUZU_REFRIGERATED: 'مبردة (إيسوزو)',
    VOLVO_FH_HEAVY: 'ثقيلة (فولفو)',
  };
  return map[type] ?? type;
}
