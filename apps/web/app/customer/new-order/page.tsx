'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui';
import { OrderForm, type OrderFormPayload } from '@/components/order-form';
import type { Order } from '@edham/shared-types';

export default function NewOrderPage(): React.ReactElement {
  const router = useRouter();

  async function submit(payload: OrderFormPayload): Promise<void> {
    await api.post<Order>('/orders', payload);
    router.push('/customer');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="طلب شحن جديد" />
      <OrderForm
        submitLabel="إرسال الطلب"
        note="سيتم مراجعة طلبك وتحديد السعر من قِبل المشرف قبل إرساله إليك."
        onSubmit={submit}
      />
    </div>
  );
}
