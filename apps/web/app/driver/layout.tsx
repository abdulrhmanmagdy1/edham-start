import { UserRole } from '@edham/shared-types';
import { DashboardShell, NavItem } from '../../components/dashboard-shell';

const NAV: NavItem[] = [{ href: '/driver', label: 'رحلاتي' }];

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <DashboardShell role={UserRole.DRIVER} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
