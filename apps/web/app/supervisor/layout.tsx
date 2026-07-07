import { UserRole } from '@edham/shared-types';
import { DashboardShell, NavItem } from '../../components/dashboard-shell';

const NAV: NavItem[] = [
  { href: '/supervisor', label: 'لوحة التحكم' },
  { href: '/supervisor/orders', label: 'الطلبات' },
  { href: '/supervisor/customers', label: 'العملاء' },
  { href: '/supervisor/map', label: 'الخريطة الحية' },
  { href: '/supervisor/vehicles', label: 'المركبات' },
  { href: '/supervisor/drivers', label: 'السائقون' },
  { href: '/supervisor/users', label: 'المستخدمون' },
  { href: '/supervisor/pricing', label: 'التسعير' },
  { href: '/supervisor/reports', label: 'التقارير' },
  { href: '/supervisor/cold-chain', label: 'سلسلة التبريد' },
  { href: '/supervisor/audit', label: 'سجل النظام' },
];

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <DashboardShell role={UserRole.SUPERVISOR} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
