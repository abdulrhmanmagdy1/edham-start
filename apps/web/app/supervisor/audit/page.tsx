'use client';

import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Card, EmptyState, ErrorText, PageHeader, Spinner } from '@/components/ui';
import { roleArabic } from '@/lib/labels';

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: { fullName: string; role: string } | null;
  ipAddress: string | null;
  timestamp: string;
}

interface AuditPage {
  data: AuditRow[];
  meta: { total: number };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ar-SA');
}

export default function SupervisorAuditPage(): React.ReactElement {
  const { data, loading, error } = useQuery<AuditPage>(
    () => api.get<AuditPage>('/audit-logs?limit=50'),
    [],
  );

  return (
    <div>
      <PageHeader title="سجل النظام (Audit Log)" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {data && (
        <Card className="overflow-x-auto p-0">
          {data.data.length === 0 ? (
            <EmptyState text="لا توجد سجلات بعد" />
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الوقت</th>
                  <th className="px-4 py-3 font-medium">المستخدم</th>
                  <th className="px-4 py-3 font-medium">العملية</th>
                  <th className="px-4 py-3 font-medium">الكيان</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-500">{formatDateTime(r.timestamp)}</td>
                    <td className="px-4 py-3 text-edham-black">
                      {r.actor ? `${r.actor.fullName} (${roleArabic(r.actor.role)})` : 'النظام'}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-700">{r.action}</td>
                    <td className="px-4 py-3 text-neutral-600">{r.entityType}</td>
                    <td className="px-4 py-3 text-xs text-neutral-400">{r.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
