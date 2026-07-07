'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Card, ErrorText, PageHeader, Spinner } from '@/components/ui';
import { OrderForm, type OrderFormPayload } from '@/components/order-form';
import type { Order } from '@edham/shared-types';

interface CustomerRow {
  id: string;
  companyName: string;
}

export default function SupervisorNewOrderForCustomerPage(): React.ReactElement {
  const router = useRouter();
  const { data, loading, error } = useQuery<CustomerRow[]>(
    () => api.get<CustomerRow[]>('/customers'),
    [],
  );
  const [customerId, setCustomerId] = useState('');

  async function submit(payload: OrderFormPayload): Promise<void> {
    if (!customerId) throw new Error('يرجى اختيار الشركة أولاً');
    await api.post<Order>('/orders/for-customer', { ...payload, customerId });
    router.push('/supervisor/orders');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="إنشاء طلب نيابةً عن شركة" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {data && (
        <>
          <Card className="mb-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">الشركة العميلة</span>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 outline-none focus:border-edham-red"
              >
                <option value="">— اختر الشركة —</option>
                {data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </label>
          </Card>

          <OrderForm
            submitLabel="إنشاء الطلب"
            disabled={!customerId}
            note="سيدخل الطلب بحالة (بانتظار التسعير) — حدّد السعر من صفحة الطلب."
            onSubmit={submit}
          />
        </>
      )}
    </div>
  );
}
