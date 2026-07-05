import { UserRole } from '@edham/shared-types';
import { DashboardShell, NavItem } from '../../components/dashboard-shell';

const NAV: NavItem[] = [
  { href: '/workshop', label: 'طلبات الصيانة' },
  { href: '/workshop/new', label: 'طلب صيانة جديد' },
];

export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <DashboardShell role={UserRole.WORKSHOP} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
