'use client';

import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Card, Spinner, ErrorText, PageHeader } from '@/components/ui';

interface ColdChainStats {
  totalReadings: number;
  violations: number;
  compliancePct: number;
  coldOrders: number;
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}): React.ReactElement {
  return (
    <Card>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? 'text-edham-red' : 'text-edham-black'}`}>
        {value}
      </p>
    </Card>
  );
}

export default function SupervisorColdChainPage(): React.ReactElement {
  const { data, loading, error } = useQuery<ColdChainStats>(
    () => api.get<ColdChainStats>('/reports/cold-chain'),
    [],
  );

  return (
    <div>
      <PageHeader title="سلسلة التبريد" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="نسبة الالتزام" value={`${data.compliancePct}%`} />
          <StatCard label="إجمالي القراءات" value={data.totalReadings.toLocaleString('ar-SA')} />
          <StatCard
            label="الانتهاكات"
            value={data.violations.toLocaleString('ar-SA')}
            accent={data.violations > 0}
          />
          <StatCard label="الطلبات المبردة" value={data.coldOrders.toLocaleString('ar-SA')} />
        </div>
      )}
    </div>
  );
}
