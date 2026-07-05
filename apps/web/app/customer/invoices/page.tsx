'use client';

import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Badge, Card, EmptyState, ErrorText, PageHeader, Spinner } from '@/components/ui';
import { invoiceStatusArabic } from '@/lib/labels';
import { Invoice } from '@edham/shared-types';

export default function InvoicesPage(): React.ReactElement {
  const { data, loading, error } = useQuery<Invoice[]>(() => api.get<Invoice[]>('/invoices/my'));

  return (
    <div>
      <PageHeader title="الفواتير" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState text="لا توجد فواتير بعد" />
      )}

      {!loading && !error && data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((invoice) => {
            const overdue = invoice.status === 'OVERDUE';
            return (
              <Card key={invoice.id} className={overdue ? 'border-edham-red' : ''}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-edham-black">
                    #{invoice.invoiceNumber}
                  </span>
                  <Badge status={invoice.status} label={invoiceStatusArabic(invoice.status)} />
                </div>
                <p
                  className={`text-2xl font-bold ${overdue ? 'text-edham-red' : 'text-edham-black'}`}
                >
                  {invoice.totalAmount} {invoice.currency}
                </p>
                <p className="mt-1 text-xs text-neutral-400">شامل ضريبة القيمة المضافة</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
