import { ArrowUpRight, Check, ThumbsUp } from 'lucide-react';
import {
  CATEGORY_LABELS,
  formatRelativeTime,
  getSlaStatusText,
} from '@/src/lib/formatters';
import {
  PriorityLabel,
  StatusLabel,
  VerifiedMarker,
} from '@/src/components/StatusIndicators';
import { EvidenceImage } from '@/src/components/ui/Primitives';
import type { CivicIssue } from '@/src/types/issue';

interface IssueCardProps {
  issue: CivicIssue;
  onSelect: (issueId: string) => void;
  onToggleEndorse: (issueId: string) => void;
}

export function IssueCard({
  issue,
  onSelect,
  onToggleEndorse,
}: IssueCardProps) {
  const primaryPhoto = issue.attachments[0];
  const sla = getSlaStatusText(
    issue.createdAt,
    issue.slaHours,
    issue.status,
    issue.resolvedAt
  );

  return (
    <article className="group rounded-xl border border-slate-200 bg-white transition-colors duration-150 hover:border-slate-300">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        {/* Main clickable content */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelect(issue.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(issue.id);
            }
          }}
          className="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 rounded"
        >
          {/* Lead directly with primary title + case ID */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-base font-semibold leading-snug text-slate-900 group-hover:text-blue-700 transition-colors">
              {issue.title}
            </h3>
            <span className="font-mono text-xs font-medium text-slate-400 tabular-nums whitespace-nowrap shrink-0 pt-0.5">
              {issue.code}
            </span>
          </div>

          {/* Unboxed inline metadata row with typographic separators */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {CATEGORY_LABELS[issue.category]}
            </span>
            <span aria-hidden="true">·</span>
            <span>{issue.address}</span>
            <span aria-hidden="true">·</span>
            <span>{issue.district}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {issue.distanceKm.toFixed(1)} km
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {formatRelativeTime(issue.createdAt)}
            </span>
          </div>

          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {issue.description}
          </p>

          {/* Operational accountability row */}
          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
            <StatusLabel status={issue.status} />
            <PriorityLabel priority={issue.priority} />

            <span
              className={`font-mono text-xs tabular-nums ${
                sla.breached
                  ? 'font-medium text-red-600'
                  : sla.atRisk
                    ? 'font-medium text-amber-700'
                    : 'text-slate-500'
              }`}
            >
              {sla.label}
            </span>

            {issue.assigneeName ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <span>Assigned: {issue.assigneeName}</span>
                <VerifiedMarker verified={issue.assigneeVerified} label="Crew" />
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Unassigned · Awaiting claim
              </span>
            )}
          </div>
        </div>

        {/* Right column: Photo preview & actions */}
        <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
          {primaryPhoto && (
            <button
              type="button"
              onClick={() => onSelect(issue.id)}
              className="overflow-hidden rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-blue-600 cursor-pointer"
              aria-label={`Inspect photo evidence for ${issue.code}`}
            >
              <EvidenceImage
                src={primaryPhoto.url}
                alt={primaryPhoto.caption || issue.title}
                className="h-16 w-24 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleEndorse(issue.id);
              }}
              aria-pressed={issue.endorsedByCurrentUser}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
                issue.endorsedByCurrentUser
                  ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Confirm you also observed this issue"
            >
              {issue.endorsedByCurrentUser ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="font-mono tabular-nums">{issue.endorsements}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelect(issue.id)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <span>Inspect</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
