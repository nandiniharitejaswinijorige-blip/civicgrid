import { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useIssues } from '@/src/context/IssueContext';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  formatDurationHours,
  formatTimestamp,
} from '@/src/lib/formatters';
import { ISSUE_CATEGORIES } from '@/src/lib/validation';
import { StatusLabel, VerifiedMarker } from '@/src/components/StatusIndicators';

export function AccountabilityView() {
  const { issues, setSelectedIssueId } = useIssues();

  const categoryRows = useMemo(() => {
    return ISSUE_CATEGORIES.map((category) => {
      const subset = issues.filter((i) => i.category === category);
      const active = subset.filter((i) => i.status !== 'resolved').length;
      const resolved = subset.filter((i) => i.status === 'resolved');
      let avgHours = 0;
      let slaMet = 0;

      for (const item of resolved) {
        const start = new Date(item.createdAt).getTime();
        const end = new Date(item.resolvedAt ?? item.updatedAt).getTime();
        const hrs = Math.max(0.2, (end - start) / 3_600_000);
        avgHours += hrs;
        if (hrs <= item.slaHours) slaMet += 1;
      }

      return {
        category,
        label: CATEGORY_LABELS[category],
        total: subset.length,
        active,
        resolvedCount: resolved.length,
        avgHours: resolved.length > 0 ? avgHours / resolved.length : null,
        slaRate:
          resolved.length > 0 ? Math.round((slaMet / resolved.length) * 100) : null,
      };
    });
  }, [issues]);

  const recentAuditEvents = useMemo(() => {
    return issues
      .flatMap((issue) =>
        issue.auditLog.map((entry) => ({
          ...entry,
          issueId: issue.id,
          issueCode: issue.code,
          issueTitle: issue.title,
          issueStatus: issue.status,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 12);
  }, [issues]);

  return (
    <div className="space-y-6">
      {/* Category SLA Performance Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            SLA Performance by Infrastructure Category
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Live breakdown of active workload, mean closure time, and SLA compliance.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="px-5 py-3">Category</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Active</th>
                <th className="px-4 py-3 text-right">Resolved</th>
                <th className="px-4 py-3 text-right">Avg Closure</th>
                <th className="px-5 py-3 text-right">SLA Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categoryRows.map((row) => (
                <tr key={row.category} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums">
                    {row.total}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums">
                    {row.active}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums">
                    {row.resolvedCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums">
                    {row.avgHours !== null
                      ? formatDurationHours(row.avgHours)
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-medium tabular-nums">
                    {row.slaRate !== null ? (
                      <span
                        className={
                          row.slaRate >= 90
                            ? 'text-emerald-700'
                            : row.slaRate >= 75
                              ? 'text-amber-700'
                              : 'text-red-600'
                        }
                      >
                        {row.slaRate}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* District-Wide Audit Feed */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Recent District Audit Log
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Immutable operational trail across all reported issues and contractor sign-offs.
          </p>
        </div>

        <ul className="divide-y divide-slate-200">
          {recentAuditEvents.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => setSelectedIssueId(event.issueId)}
                className="flex w-full flex-col gap-2 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 cursor-pointer sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-blue-700">
                      {event.issueCode}
                    </span>
                    <span className="font-medium text-slate-900">
                      {event.actionLabel}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-700">{event.actorName}</span>
                    <VerifiedMarker verified={event.actorVerified} />
                    {event.fromStatus && event.toStatus && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-slate-500">
                          {STATUS_LABELS[event.fromStatus]} →{' '}
                          {STATUS_LABELS[event.toStatus]}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {event.note}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <StatusLabel status={event.issueStatus} />
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    {formatTimestamp(event.timestamp)}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
