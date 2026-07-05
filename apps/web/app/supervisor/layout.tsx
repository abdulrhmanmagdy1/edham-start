import { UserRole } from '@edham/shared-types';
import { DashboardShell, NavItem } from '../../components/dashboard-shell';

const NAV: NavItem[] = [
  { href: '/supervisor', label: 'لوحة التحكم' },
  { href: '/supervisor/orders', label: 'الطلبات' },
  { href: '/supervisor/map', label: 'الخريطة الحية' },
  { href: '/supervisor/fleet', label: 'الأسطول' },
  { href: '/supervisor/drivers', label: 'السائقون' },
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
