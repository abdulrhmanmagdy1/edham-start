'use client';

import { useState } from 'react';
import { type Invoice, type Order } from '@edham/shared-types';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Badge, Button, Card, EmptyState, ErrorText, PageHeader, Spinner } from '@/components/ui';
import { orderStatusArabic } from '@/lib/labels';

function InlineSpinner(): React.ReactElement {
  return (
    <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent align-[-2px]" />
  );
}

function formatWeight(kg: number): string {
  return `${kg.toLocaleString('ar-SA')} كجم`;
}

interface RowFeedback {
  message: string;
  ok: boolean;
}

export default function BillableOrdersPage(): React.ReactElement {
  // طلبات مكتملة بلا فاتورة فقط (نستبعد المُفوترة لتجنّب تكرار الفوترة)
  const { data, loading, error, refetch } = useQuery<Order[]>(async () => {
    const [orders, invoices] = await Promise.all([
      api.get<Order[]>('/orders?status=COMPLETED'),
      api.get<Invoice[]>('/invoices?page=1&limit=200'),
    ]);
    const invoiced = new Set(invoices.map((i) => i.orderId));
    return orders.filter((o) => !invoiced.has(o.id));
  }, []);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, RowFeedback>>({});

  async function createInvoice(orderId: string): Promise<void> {
    setBusyId(orderId);
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
    try {
      await api.post<Invoice>('/invoices', { orderId });
      setFeedback((prev) => ({ ...prev, [orderId]: { message: 'تم إنشاء الفاتورة بنجاح', ok: true } }));
      refetch();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع';
      setFeedback((prev) => ({ ...prev, [orderId]: { message, ok: false } }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="طلبات جاهزة للفوترة" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState text="لا توجد طلبات مكتملة بانتظار الفوترة" />
      )}

      {!loading && !error && data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((order) => {
            const rowFeedback = feedback[order.id];
            const busy = busyId === order.id;
            return (
              <Card key={order.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm text-neutral-500">#{order.id.slice(0, 8)}</span>
                  <Badge status={order.status} label={orderStatusArabic(order.status)} />
                </div>

                <div className="space-y-1 text-sm text-neutral-700">
                  <p>
                    <span className="text-neutral-400">من: </span>
                    {order.pickupAddress}
                  </p>
                  <p>
                    <span className="text-neutral-400">إلى: </span>
                    {order.deliveryAddress}
                  </p>
                  <p>
                    <span className="text-neutral-400">الوزن: </span>
                    {formatWeight(order.cargoWeightKg)}
                  </p>
                  {order.quotedPrice !== null && (
                    <p>
                      <span className="text-neutral-400">السعر المعتمد: </span>
                      {order.quotedPrice.toLocaleString('ar-SA')} {order.currency}
                    </p>
                  )}
                </div>

                <Button onClick={() => void createInvoice(order.id)} disabled={busy} className="w-full">
                  {busy ? (
                    <>
                      جارٍ الإنشاء
                      <InlineSpinner />
                    </>
                  ) : (
                    'إنشاء فاتورة'
                  )}
                </Button>

                {rowFeedback && (
                  <p className={`text-sm ${rowFeedback.ok ? 'text-green-700' : 'text-red-700'}`}>
                    {rowFeedback.message}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
