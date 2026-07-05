'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import {
  Button,
  Card,
  Input,
  Spinner,
  ErrorText,
  PageHeader,
  Badge,
  EmptyState,
} from '@/components/ui';
import { orderStatusArabic, vehicleTypeArabic } from '@/lib/labels';
import { OrderStatus, DriverStatus } from '@edham/shared-types';
import type { Order, Vehicle, Driver } from '@edham/shared-types';

function DetailRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 py-2.5 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-edham-black">{value}</span>
    </div>
  );
}

function SetPriceForm({
  order,
  onDone,
}: {
  order: Order;
  onDone: () => void;
}): React.ReactElement {
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(): Promise<void> {
    setErr(null);
    const value = Number(price);
    if (!Number.isFinite(value) || value <= 0) {
      setErr('أدخل سعراً صحيحاً أكبر من صفر');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch<Order>(`/orders/${order.id}/set-price`, {
        quotedPrice: value,
        pricingNotes: notes.trim() === '' ? undefined : notes.trim(),
      });
      setSuccess(true);
      onDone();
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <h2 className="mb-4 text-lg font-bold text-edham-black">تحديد السعر</h2>
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          تم إرسال السعر للعميل بنجاح — بانتظار موافقته.
        </div>
      )}
      <div className="space-y-4">
        <Input
          label="السعر (ريال، قبل الضريبة)"
          type="number"
          value={price}
          onChange={setPrice}
          placeholder="0.00"
        />
        <Input label="ملاحظات التسعير (اختياري)" value={notes} onChange={setNotes} />
        {err && <ErrorText message={err} />}
        <Button type="button" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'جارٍ الإرسال…' : 'إرسال السعر للعميل'}
        </Button>
      </div>
    </Card>
  );
}

function AssignSection({
  order,
  onDone,
}: {
  order: Order;
  onDone: () => void;
}): React.ReactElement {
  const vehiclesPath =
    order.coldChainRequired && order.temperatureType
      ? `/vehicles/available?temperatureType=${order.temperatureType}`
      : '/vehicles/available';

  const vehiclesQ = useQuery<Vehicle[]>(() => api.get<Vehicle[]>(vehiclesPath), [vehiclesPath]);
  const driversQ = useQuery<Driver[]>(() => api.get<Driver[]>('/drivers'), []);

  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const availableDrivers = (driversQ.data ?? []).filter(
    (d) => d.status === DriverStatus.AVAILABLE,
  );
  const vehicles = vehiclesQ.data ?? [];

  async function submit(): Promise<void> {
    setErr(null);
    if (vehicleId === '' || driverId === '') {
      setErr('اختر مركبة وسائقاً أولاً');
      return;
    }
    setSubmitting(true);
    try {
      await api.post<Order>(`/orders/${order.id}/assign`, { driverId, vehicleId });
      setSuccess(true);
      onDone();
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  const selectClass =
    'w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-edham-red';

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold text-edham-black">إسناد سائق ومركبة</h2>
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          تم إسناد الطلب بنجاح.
        </div>
      )}

      {(vehiclesQ.loading || driversQ.loading) && <Spinner />}
      {vehiclesQ.error && <ErrorText message={vehiclesQ.error} />}
      {driversQ.error && <ErrorText message={driversQ.error} />}

      {!vehiclesQ.loading && !driversQ.loading && (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">المركبة</span>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className={selectClass}
            >
              <option value="">اختر مركبة…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} — {vehicleTypeArabic(v.type)} ({v.capacityKg} كجم)
                </option>
              ))}
            </select>
            {vehicles.length === 0 && (
              <span className="mt-1 block text-xs text-amber-600">لا توجد مركبات متاحة مطابقة</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">السائق</span>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className={selectClass}
            >
              <option value="">اختر سائقاً…</option>
              {availableDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.employeeId}
                </option>
              ))}
            </select>
            {availableDrivers.length === 0 && (
              <span className="mt-1 block text-xs text-amber-600">لا يوجد سائقون متاحون</span>
            )}
          </label>

          {err && <ErrorText message={err} />}
          <Button type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? 'جارٍ الإسناد…' : 'إسناد الطلب'}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function OrderDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: order, loading, error, refetch } = useQuery<Order>(
    () => api.get<Order>(`/orders/${id}`),
    [id],
  );

  return (
    <div>
      <PageHeader title="تفاصيل الطلب" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}
      {!loading && !error && !order && <EmptyState text="الطلب غير موجود" />}

      {order && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-edham-black">بيانات الطلب</h2>
              <Badge status={order.status} label={orderStatusArabic(order.status)} />
            </div>
            <DetailRow label="عنوان الاستلام" value={order.pickupAddress} />
            <DetailRow label="عنوان التسليم" value={order.deliveryAddress} />
            <DetailRow label="نوع المركبة المطلوبة" value={vehicleTypeArabic(order.vehicleTypeRequired)} />
            <DetailRow label="وزن الشحنة" value={`${order.cargoWeightKg} كجم`} />
            <DetailRow label="نوع البضاعة" value={order.cargoType} />
            <DetailRow
              label="سلسلة التبريد"
              value={order.coldChainRequired ? 'مطلوبة' : 'غير مطلوبة'}
            />
            {order.temperatureType && (
              <DetailRow
                label="نوع التبريد"
                value={order.temperatureType === 'FROZEN' ? 'مجمّد' : 'مبرّد'}
              />
            )}
            {order.quotedPrice !== null && (
              <DetailRow
                label="السعر المحدد"
                value={`${order.quotedPrice.toLocaleString('ar-SA')} ${order.currency}`}
              />
            )}
            <DetailRow
              label="موعد الجدولة"
              value={new Date(order.scheduledAt).toLocaleString('ar-SA')}
            />
          </Card>

          <div>
            {order.status === OrderStatus.PENDING_PRICING && (
              <SetPriceForm order={order} onDone={refetch} />
            )}
            {order.status === OrderStatus.CUSTOMER_CONFIRMED && (
              <AssignSection order={order} onDone={refetch} />
            )}
            {order.status !== OrderStatus.PENDING_PRICING &&
              order.status !== OrderStatus.CUSTOMER_CONFIRMED && (
                <Card>
                  <p className="text-sm text-neutral-500">
                    لا يوجد إجراء متاح لهذه الحالة حالياً — الحالة:{' '}
                    <span className="font-semibold text-edham-black">
                      {orderStatusArabic(order.status)}
                    </span>
                  </p>
                </Card>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
