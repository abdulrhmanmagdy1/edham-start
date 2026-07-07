'use client';

import Link from 'next/link';
import { InvoiceStatus, type Invoice } from '@edham/shared-types';
import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Badge, Card, EmptyState, ErrorText, PageHeader, Spinner } from '@/components/ui';
import { invoiceStatusArabic } from '@/lib/labels';

interface FinancialSummary {
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  thisMonthRevenue: number;
  byStatus: Record<string, number>;
}

interface DashboardData {
  summary: FinancialSummary;
  invoices: Invoice[];
}

async function load(): Promise<DashboardData> {
  const [summary, invoices] = await Promise.all([
    api.get<FinancialSummary>('/invoices/summary'),
    api.get<Invoice[]>('/invoices?page=1&limit=50'),
  ]);
  return { summary, invoices };
}

function formatMoney(amount: number): string {
  return `${amount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-SA');
}

function isOverdue(inv: Invoice): boolean {
  return (
    inv.status !== InvoiceStatus.PAID && inv.dueAt !== null && new Date(inv.dueAt).getTime() < Date.now()
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}): React.ReactElement {
  return (
    <Card>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </Card>
  );
}

export default function AccountantDashboardPage(): React.ReactElement {
  const { data, loading, error } = useQuery<DashboardData>(() => load(), []);

  return (
    <div>
      <PageHeader title="اللوحة المالية" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="المستحق (غير محصّل)"
              value={formatMoney(data.summary.outstanding)}
              accent="text-amber-600"
            />
            <StatCard
              label="متأخرات"
              value={`${formatMoney(data.summary.overdueAmount)} (${data.summary.overdueCount})`}
              accent="text-red-600"
            />
            <StatCard
              label="إيراد هذا الشهر"
              value={formatMoney(data.summary.thisMonthRevenue)}
              accent="text-green-600"
            />
            <StatCard
              label="إجمالي المدفوع"
              value={formatMoney(data.summary.totalPaid)}
              accent="text-edham-black"
            />
          </div>

          <h2 className="mb-3 mt-8 text-lg font-bold text-edham-black">الفواتير</h2>
          {data.invoices.length === 0 ? (
            <EmptyState text="لا توجد فواتير بعد" />
          ) : (
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-right text-sm">
                <thead className="border-b border-neutral-200 text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">رقم الفاتورة</th>
                    <th className="px-4 py-3 font-medium">الإجمالي</th>
                    <th className="px-4 py-3 font-medium">تاريخ الاستحقاق</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => {
                    const overdue = isOverdue(inv);
                    return (
                      <tr key={inv.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                        <td className="px-4 py-3 font-semibold text-edham-black">
                          <Link href={`/accountant/invoices/${inv.id}`} className="hover:text-edham-red">
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-edham-black">
                          {inv.totalAmount.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {inv.currency}
                        </td>
                        <td className={`px-4 py-3 ${overdue ? 'font-semibold text-red-600' : 'text-neutral-600'}`}>
                          {formatDate(inv.dueAt)}
                          {overdue && <span className="mr-2 text-xs">(متأخرة)</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            status={overdue ? 'OVERDUE' : inv.status}
                            label={overdue ? invoiceStatusArabic('OVERDUE') : invoiceStatusArabic(inv.status)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
