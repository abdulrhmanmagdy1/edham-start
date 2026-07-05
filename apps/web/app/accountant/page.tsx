'use client';

import Link from 'next/link';
import { InvoiceStatus, type Invoice } from '@edham/shared-types';
import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Badge, Card, EmptyState, ErrorText, PageHeader, Spinner } from '@/components/ui';
import { invoiceStatusArabic } from '@/lib/labels';

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-SA');
}

function isOverdue(inv: Invoice): boolean {
  return (
    inv.status !== InvoiceStatus.PAID &&
    inv.dueAt !== null &&
    new Date(inv.dueAt).getTime() < Date.now()
  );
}

export default function AccountantInvoicesPage(): React.ReactElement {
  const { data, loading, error } = useQuery<Invoice[]>(
    () => api.get<Invoice[]>('/invoices?page=1&limit=50'),
    [],
  );

  return (
    <div>
      <PageHeader title="الفواتير" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState text="لا توجد فواتير بعد" />
      )}

      {!loading && !error && data && data.length > 0 && (
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
              {data.map((inv) => {
                const overdue = isOverdue(inv);
                return (
                  <tr key={inv.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-semibold text-edham-black">
                      <Link href={`/accountant/invoices/${inv.id}`} className="hover:text-edham-red">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-edham-black">
                      {formatMoney(inv.totalAmount, inv.currency)}
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
    </div>
  );
}
