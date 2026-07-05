import { UserRole } from '@edham/shared-types';
import { DashboardShell, NavItem } from '../../components/dashboard-shell';

const NAV: NavItem[] = [
  { href: '/customer', label: 'طلباتي' },
  { href: '/customer/new-order', label: 'طلب شحن جديد' },
  { href: '/customer/invoices', label: 'الفواتير' },
];

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <DashboardShell role={UserRole.CUSTOMER} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
