import { CheckCircle2, UserCheck } from 'lucide-react';
import { useIssues } from '@/src/context/IssueContext';
import { CATEGORY_LABELS, formatDurationHours } from '@/src/lib/formatters';
import { VerifiedMarker } from '@/src/components/StatusIndicators';
import { Button } from '@/src/components/ui/Primitives';

export function ContractorsView() {
  const {
    contractors,
    issues,
    activeUser,
    switchPersona,
    setActiveView,
    setFilters,
  } = useIssues();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Verified District Crews & Stewards
          </h2>
          <p className="text-xs text-slate-500">
            Credibility metrics reflect historical SLA adherence and verified repair sign-offs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {contractors.map((crew) => {
          const activeAssigned = issues.filter(
            (i) => i.assigneeId === crew.id && i.status !== 'resolved'
          ).length;
          const isCurrent = activeUser.id === crew.id;

          return (
            <article
              key={crew.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        {crew.name}
                      </h3>
                      <VerifiedMarker verified={crew.verified} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {crew.title} · {crew.organization}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-500">
                    {crew.district}
                  </span>
                </div>

                {crew.specialty && crew.specialty.length > 0 && (
                  <p className="mt-3 text-xs text-slate-600">
                    Specialties:{' '}
                    <span className="font-medium text-slate-800">
                      {crew.specialty.map((s) => CATEGORY_LABELS[s]).join(' · ')}
                    </span>
                  </p>
                )}

                {/* Accountability Metrics Row */}
                <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-100 py-3">
                  <div className="pr-3">
                    <p className="text-[11px] text-slate-500">Completion Rate</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {crew.completionRate}%
                    </p>
                  </div>
                  <div className="px-3">
                    <p className="text-[11px] text-slate-500">Avg SLA Time</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {formatDurationHours(crew.avgResolutionHours)}
                    </p>
                  </div>
                  <div className="pl-3">
                    <p className="text-[11px] text-slate-500">Active / Closed</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {activeAssigned} / {crew.resolvedCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ search: crew.name, status: 'all' });
                    setActiveView('feed');
                  }}
                  className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 cursor-pointer"
                >
                  View assigned reports
                </button>

                {isCurrent ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Active Role</span>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => switchPersona(crew.id)}
                  >
                    <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Act as {crew.name.split(' ')[0]}</span>
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
