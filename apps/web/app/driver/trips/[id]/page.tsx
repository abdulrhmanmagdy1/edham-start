'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TripStatus, type Trip } from '@edham/shared-types';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Badge, Button, Card, ErrorText, Input, PageHeader, Spinner } from '@/components/ui';

interface TripStop {
  id: string;
  sequenceNumber: number;
  address: string;
  city: string | null;
  contactName: string | null;
  status: string;
}

function tripStatusArabic(status: string): string {
  const map: Record<string, string> = {
    [TripStatus.ASSIGNED]: 'مُسندة',
    [TripStatus.IN_PROGRESS]: 'جارية',
    [TripStatus.AT_STOP]: 'عند محطة',
    [TripStatus.COMPLETED]: 'مكتملة',
    [TripStatus.CANCELLED]: 'ملغاة',
  };
  return map[status] ?? status;
}

function stopStatusArabic(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'بانتظار',
    ARRIVED: 'تم الوصول',
    DELIVERED: 'تم التسليم',
  };
  return map[status] ?? status;
}

function isActive(status: string): boolean {
  return status !== TripStatus.COMPLETED && status !== TripStatus.CANCELLED;
}

function InlineSpinner(): React.ReactElement {
  return (
    <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent align-[-2px]" />
  );
}

export default function DriverTripDetailPage({
  params,
}: {
  params: { id: string };
}): React.ReactElement {
  const { id } = params;

  const trip = useQuery<Trip>(() => api.get<Trip>(`/trips/${id}`), [id]);
  const stops = useQuery<TripStop[]>(() => api.get<TripStop[]>(`/trips/${id}/stops`), [id]);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // تسليم محطة
  const [deliverStopId, setDeliverStopId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');

  // درجة الحرارة
  const [showTempForm, setShowTempForm] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const [tempViolation, setTempViolation] = useState<boolean | null>(null);

  // الإبلاغ عن مشكلة
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueDesc, setIssueDesc] = useState('');
  const [issueSent, setIssueSent] = useState(false);

  function refetchAll(): void {
    trip.refetch();
    stops.refetch();
  }

  async function runAction(fn: () => Promise<unknown>, onDone?: () => void): Promise<void> {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      onDone?.();
      refetchAll();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setBusy(false);
    }
  }

  const confirmLoading = (): Promise<void> =>
    runAction(() => api.post<Trip>(`/trips/${id}/confirm-loading`));

  const startTrip = (): Promise<void> => runAction(() => api.post<Trip>(`/trips/${id}/start`));

  const deliverStop = (stopId: string): Promise<void> =>
    runAction(
      () =>
        api.post<Trip>(`/trips/${id}/stops/${stopId}/deliver`, {
          recipientName: recipientName.trim() || undefined,
        }),
      () => {
        setDeliverStopId(null);
        setRecipientName('');
      },
    );

  const submitTemperature = (): Promise<void> =>
    runAction(
      async () => {
        const res = await api.post<{ isViolation: boolean }>('/temperature-logs', {
          tripId: id,
          temperatureCelsius: Number(tempValue),
          notes: tempNotes.trim() || undefined,
        });
        setTempViolation(res.isViolation);
      },
      () => {
        setTempValue('');
        setTempNotes('');
      },
    );

  const submitIssue = (): Promise<void> =>
    runAction(
      () => api.post<{ success: boolean }>(`/trips/${id}/report-issue`, { description: issueDesc.trim() }),
      () => {
        setShowIssueForm(false);
        setIssueDesc('');
        setIssueSent(true);
      },
    );

  const loading = trip.loading || stops.loading;
  const error = trip.error ?? stops.error;
  const data = trip.data;
  const active = data ? isActive(data.status) : false;
  const canDeliver =
    data !== null && (data.status === TripStatus.IN_PROGRESS || data.status === TripStatus.AT_STOP);

  return (
    <div>
      <PageHeader
        title="تفاصيل الرحلة"
        action={
          <Link href="/driver" className="text-sm text-neutral-500 hover:text-edham-red">
            → رجوع للرحلات
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
                <h2 className="text-lg font-bold text-edham-black">رحلة #{data.id.slice(0, 8)}</h2>
                <p className="text-sm text-neutral-500">طلب #{data.orderId.slice(0, 8)}</p>
              </div>
              <Badge status={data.status} label={tripStatusArabic(data.status)} />
            </div>
            <dl className="space-y-2 text-sm text-neutral-600">
              <div className="flex justify-between">
                <dt className="text-neutral-400">عدد المحطات</dt>
                <dd>{data.totalStops}</dd>
              </div>
              {data.estimatedDistanceKm !== null && (
                <div className="flex justify-between">
                  <dt className="text-neutral-400">المسافة التقديرية</dt>
                  <dd>{data.estimatedDistanceKm} كم</dd>
                </div>
              )}
            </dl>
          </Card>

          {actionError && <ErrorText message={actionError} />}

          {/* أزرار الحالة ASSIGNED */}
          {data.status === TripStatus.ASSIGNED && (
            <Card>
              <div className="space-y-3">
                <Button onClick={() => void confirmLoading()} disabled={busy} className="w-full">
                  {busy ? (
                    <>
                      جارٍ التنفيذ
                      <InlineSpinner />
                    </>
                  ) : (
                    'تأكيد التحميل'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void startTrip()}
                  disabled={busy}
                  className="w-full"
                >
                  بدء الرحلة
                </Button>
              </div>
            </Card>
          )}

          {/* المحطات */}
          <Card>
            <h3 className="mb-3 text-sm font-bold text-edham-black">المحطات</h3>
            {stops.data && stops.data.length === 0 && (
              <p className="py-4 text-center text-sm text-neutral-400">لا توجد محطات</p>
            )}
            <ol className="space-y-3">
              {stops.data &&
                stops.data.map((stop) => {
                  const delivered = stop.status === 'DELIVERED';
                  return (
                    <li
                      key={stop.id}
                      className="rounded-xl border border-neutral-200 p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-semibold text-edham-black">
                            {stop.sequenceNumber}. {stop.address}
                          </span>
                          <div className="text-xs text-neutral-500">
                            {stop.city ?? '—'}
                            {stop.contactName ? ` · ${stop.contactName}` : ''}
                          </div>
                        </div>
                        <Badge status={stop.status} label={stopStatusArabic(stop.status)} />
                      </div>

                      {canDeliver && !delivered && (
                        <div className="mt-3">
                          {deliverStopId !== stop.id && (
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                setDeliverStopId(stop.id);
                                setRecipientName('');
                              }}
                            >
                              تسليم المحطة
                            </Button>
                          )}
                          {deliverStopId === stop.id && (
                            <div className="space-y-3">
                              <Input
                                label="اسم المستلم (اختياري)"
                                value={recipientName}
                                onChange={setRecipientName}
                                placeholder="اسم من استلم الشحنة"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => void deliverStop(stop.id)}
                                  disabled={busy}
                                  className="flex-1"
                                >
                                  {busy ? (
                                    <>
                                      جارٍ التسليم
                                      <InlineSpinner />
                                    </>
                                  ) : (
                                    'تأكيد التسليم'
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() => {
                                    setDeliverStopId(null);
                                    setRecipientName('');
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
                    </li>
                  );
                })}
            </ol>
          </Card>

          {/* درجة الحرارة + الإبلاغ عن مشكلة */}
          {active && (
            <Card>
              <div className="space-y-4">
                {/* درجة الحرارة */}
                <div>
                  {!showTempForm && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setShowTempForm(true);
                        setTempViolation(null);
                      }}
                      className="w-full"
                    >
                      تسجيل درجة حرارة
                    </Button>
                  )}
                  {showTempForm && (
                    <div className="space-y-3">
                      <Input
                        label="درجة الحرارة (°م)"
                        type="number"
                        value={tempValue}
                        onChange={setTempValue}
                        placeholder="مثال: 4"
                      />
                      <Input
                        label="ملاحظات (اختياري)"
                        value={tempNotes}
                        onChange={setTempNotes}
                        placeholder="أي ملاحظة عن القراءة"
                      />
                      {tempViolation === true && (
                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                          تحذير: درجة الحرارة خارج النطاق المسموح (مخالفة)
                        </div>
                      )}
                      {tempViolation === false && (
                        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                          تم تسجيل القراءة ضمن النطاق المسموح
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => void submitTemperature()}
                          disabled={busy || tempValue.trim() === ''}
                          className="flex-1"
                        >
                          {busy ? (
                            <>
                              جارٍ الحفظ
                              <InlineSpinner />
                            </>
                          ) : (
                            'حفظ القراءة'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() => {
                            setShowTempForm(false);
                            setTempValue('');
                            setTempNotes('');
                            setTempViolation(null);
                          }}
                          className="flex-1"
                        >
                          إغلاق
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* الإبلاغ عن مشكلة */}
                <div>
                  {issueSent && !showIssueForm && (
                    <div className="mb-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
                      تم إرسال البلاغ
                    </div>
                  )}
                  {!showIssueForm && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setShowIssueForm(true);
                        setIssueSent(false);
                      }}
                      className="w-full"
                    >
                      الإبلاغ عن مشكلة
                    </Button>
                  )}
                  {showIssueForm && (
                    <div className="space-y-3">
                      <Input
                        label="وصف المشكلة"
                        value={issueDesc}
                        onChange={setIssueDesc}
                        placeholder="اشرح المشكلة التي واجهتها"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => void submitIssue()}
                          disabled={busy || issueDesc.trim() === ''}
                          className="flex-1"
                        >
                          {busy ? (
                            <>
                              جارٍ الإرسال
                              <InlineSpinner />
                            </>
                          ) : (
                            'إرسال البلاغ'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() => {
                            setShowIssueForm(false);
                            setIssueDesc('');
                          }}
                          className="flex-1"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
