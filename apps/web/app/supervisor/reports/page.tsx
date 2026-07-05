'use client';

import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Card, Spinner, ErrorText, PageHeader, EmptyState } from '@/components/ui';

interface OrdersPerWeek {
  week: string;
  count: number;
}

interface RevenuePerMonth {
  month: string;
  revenue: number;
}

interface DriverPerformance {
  employeeId: string;
  fullName: string;
  completedTrips: number;
}

function OrdersPerWeekSection(): React.ReactElement {
  const { data, loading, error } = useQuery<OrdersPerWeek[]>(
    () => api.get<OrdersPerWeek[]>('/reports/orders-per-week'),
    [],
  );

  const max = data && data.length > 0 ? Math.max(...data.map((d) => d.count), 1) : 1;

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-bold text-edham-black">الطلبات لكل أسبوع</h2>
      {loading && <Spinner />}
      {error && <ErrorText message={error} />}
      {data &&
        (data.length === 0 ? (
          <EmptyState text="لا توجد بيانات" />
        ) : (
          <ul className="space-y-3">
            {data.map((row) => (
              <li key={row.week} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-neutral-500">{row.week}</span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-edham-red"
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-left text-sm font-semibold text-edham-black">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </Card>
  );
}

function RevenuePerMonthSection(): React.ReactElement {
  const { data, loading, error } = useQuery<RevenuePerMonth[]>(
    () => api.get<RevenuePerMonth[]>('/reports/revenue-per-month'),
    [],
  );

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-bold text-edham-black">الإيرادات لكل شهر</h2>
      {loading && <Spinner />}
      {error && <ErrorText message={error} />}
      {data &&
        (data.length === 0 ? (
          <EmptyState text="لا توجد بيانات" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="py-2 font-medium">الشهر</th>
                  <th className="py-2 font-medium">الإيراد (ر.س)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.month} className="border-b border-neutral-100">
                    <td className="py-2.5 text-edham-black">{row.month}</td>
                    <td className="py-2.5 font-semibold text-edham-black">
                      {row.revenue.toLocaleString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </Card>
  );
}

function DriverPerformanceSection(): React.ReactElement {
  const { data, loading, error } = useQuery<DriverPerformance[]>(
    () => api.get<DriverPerformance[]>('/reports/driver-performance'),
    [],
  );

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold text-edham-black">أداء السائقين</h2>
      {loading && <Spinner />}
      {error && <ErrorText message={error} />}
      {data &&
        (data.length === 0 ? (
          <EmptyState text="لا توجد بيانات" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="py-2 font-medium">الرقم الوظيفي</th>
                  <th className="py-2 font-medium">الاسم</th>
                  <th className="py-2 font-medium">الرحلات المكتملة</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.employeeId} className="border-b border-neutral-100">
                    <td className="py-2.5 text-neutral-500">{row.employeeId}</td>
                    <td className="py-2.5 text-edham-black">{row.fullName}</td>
                    <td className="py-2.5 font-semibold text-edham-black">{row.completedTrips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </Card>
  );
}

export default function SupervisorReportsPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="التقارير" />
      <OrdersPerWeekSection />
      <RevenuePerMonthSection />
      <DriverPerformanceSection />
    </div>
  );
}
