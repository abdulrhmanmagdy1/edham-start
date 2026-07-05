'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InvoiceStatus, type Invoice } from '@edham/shared-types';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Badge, Button, Card, ErrorText, Input, PageHeader, Spinner } from '@/components/ui';
import { invoiceStatusArabic } from '@/lib/labels';

function InlineSpinner(): React.ReactElement {
  return (
    <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent align-[-2px]" />
  );
}

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA');
}

function isOverdue(inv: Invoice): boolean {
  return (
    inv.status !== InvoiceStatus.PAID &&
    inv.dueAt !== null &&
    new Date(inv.dueAt).getTime() < Date.now()
  );
}

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 py-2.5 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="font-medium text-edham-black">{value}</span>
    </div>
  );
}

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}): React.ReactElement {
  const { id } = params;
  const { data, loading, error, refetch } = useQuery<Invoice>(
    () => api.get<Invoice>(`/invoices/${id}`),
    [id],
  );

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showPayForm, setShowPayForm] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

  async function runAction(fn: () => Promise<Invoice>): Promise<void> {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      refetch();
      setShowPayForm(false);
      setPaymentReference('');
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setBusy(false);
    }
  }

  const sendInvoice = (): Promise<void> =>
    runAction(() => api.post<Invoice>(`/invoices/${id}/send`));

  const markPaid = (): Promise<void> =>
    runAction(() =>
      api.post<Invoice>(`/invoices/${id}/mark-paid`, {
        paymentReference: paymentReference.trim() || undefined,
      }),
    );

  return (
    <div>
      <PageHeader
        title="تفاصيل الفاتورة"
        action={
          <Link href="/accountant" className="text-sm text-neutral-500 hover:text-edham-red">
            → رجوع للفواتير
          </Link>
        }
      />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {!loading && !error && data && (
        <div className="mx-auto max-w-2xl space-y-4">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-edham-black">{data.invoiceNumber}</h2>
                <p className="text-sm text-neutral-500">طلب #{data.orderId.slice(0, 8)}</p>
              </div>
              <Badge
                status={isOverdue(data) ? 'OVERDUE' : data.status}
                label={isOverdue(data) ? invoiceStatusArabic('OVERDUE') : invoiceStatusArabic(data.status)}
              />
            </div>

            <Row label="المبلغ قبل الضريبة" value={formatMoney(data.subtotal, data.currency)} />
            <Row
              label={`ضريبة القيمة المضافة (${(data.vatRate * 100).toLocaleString('ar-SA')}%)`}
              value={formatMoney(data.vatAmount, data.currency)}
            />
            <Row label="الإجمالي" value={formatMoney(data.totalAmount, data.currency)} />
          </Card>

          <Card>
            <Row label="تاريخ الإصدار" value={formatDateTime(data.issuedAt)} />
            <Row label="تاريخ الاستحقاق" value={formatDateTime(data.dueAt)} />
            <Row label="تاريخ الدفع" value={formatDateTime(data.paidAt)} />
            {data.paymentReference && <Row label="مرجع الدفع" value={data.paymentReference} />}
          </Card>

          {actionError && <ErrorText message={actionError} />}

          {(data.status === InvoiceStatus.DRAFT ||
            data.status === InvoiceStatus.SENT ||
            data.status === InvoiceStatus.OVERDUE) && (
            <Card>
              {data.status === InvoiceStatus.DRAFT && (
                <Button onClick={() => void sendInvoice()} disabled={busy} className="w-full">
                  {busy ? (
                    <>
                      جارٍ الإرسال
                      <InlineSpinner />
                    </>
                  ) : (
                    'إرسال للعميل'
                  )}
                </Button>
              )}

              {(data.status === InvoiceStatus.SENT || data.status === InvoiceStatus.OVERDUE) && (
                <div className="space-y-3">
                  {!showPayForm && (
                    <Button onClick={() => setShowPayForm(true)} className="w-full">
                      تسجيل الدفع
                    </Button>
                  )}
                  {showPayForm && (
                    <div className="space-y-3">
                      <Input
                        label="مرجع الدفع (اختياري)"
                        value={paymentReference}
                        onChange={setPaymentReference}
                        placeholder="رقم التحويل / المرجع البنكي"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => void markPaid()} disabled={busy} className="flex-1">
                          {busy ? (
                            <>
                              جارٍ الحفظ
                              <InlineSpinner />
                            </>
                          ) : (
                            'تأكيد الدفع'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            setShowPayForm(false);
                            setPaymentReference('');
                          }}
                          className="flex-1"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
