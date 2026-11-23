import { useIssues } from '@/src/context/IssueContext';
import { formatDurationHours } from '@/src/lib/formatters';
import { Skeleton } from '@/src/components/ui/Primitives';

export function KpiBar() {
  const { kpis, isLoading } = useIssues();

  if (isLoading) {
    return (
      <section
        aria-label="Key metrics loading"
        className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0"
      >
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="p-4 sm:px-5 sm:py-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-2.5 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </section>
    );
  }

  const metrics = [
    {
      label: 'Active Issues',
      value: String(kpis.activeCount),
      detail: `${kpis.criticalActiveCount} urgent or high priority`,
    },
    {
      label: 'Avg Resolution Time',
      value:
        kpis.totalResolved > 0
          ? formatDurationHours(kpis.avgResolutionHours)
          : '—',
      detail: 'From initial intake to sign-off',
    },
    {
      label: 'Total Resolved',
      value: String(kpis.totalResolved),
      detail: `${kpis.resolutionRatePercent}% of district reports closed`,
    },
    {
      label: 'SLA Compliance',
      value: `${kpis.slaCompliancePercent}%`,
      detail: 'Resolved within priority target window',
    },
  ];

  return (
    <section
      aria-label="District operational metrics"
      className="grid grid-cols-2 divide-x divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-y-0"
    >
      {metrics.map((item) => (
        <div key={item.label} className="px-4 py-3.5 sm:px-5 sm:py-4">
          <p className="text-xs font-medium text-slate-500">{item.label}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {item.value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
        </div>
      ))}
    </section>
  );
}
