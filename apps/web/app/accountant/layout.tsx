import { UserRole } from '@edham/shared-types';
import { DashboardShell, NavItem } from '../../components/dashboard-shell';

const NAV: NavItem[] = [
  { href: '/accountant', label: 'الفواتير' },
  { href: '/accountant/billable', label: 'جاهزة للفوترة' },
];

export default function AccountantLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <DashboardShell role={UserRole.ACCOUNTANT} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
