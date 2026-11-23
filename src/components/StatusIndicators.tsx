import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/src/lib/formatters';
import type { IssuePriority, IssueStatus } from '@/src/types/issue';

export function StatusLabel({ status }: { status: IssueStatus }) {
  const config: Record<
    IssueStatus,
    { text: string; colorClass: string; Icon: typeof Clock }
  > = {
    open: {
      text: STATUS_LABELS.open,
      colorClass: 'text-slate-700',
      Icon: Clock,
    },
    in_review: {
      text: STATUS_LABELS.in_review,
      colorClass: 'text-amber-700',
      Icon: Eye,
    },
    in_progress: {
      text: STATUS_LABELS.in_progress,
      colorClass: 'text-blue-700',
      Icon: Wrench,
    },
    resolved: {
      text: STATUS_LABELS.resolved,
      colorClass: 'text-emerald-700',
      Icon: CheckCircle2,
    },
  };

  const { text, colorClass, Icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${colorClass}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}

export function PriorityLabel({ priority }: { priority: IssuePriority }) {
  const config: Record<
    IssuePriority,
    { label: string; textClass: string; barClass: string }
  > = {
    critical: {
      label: PRIORITY_LABELS.critical,
      textClass: 'text-red-700',
      barClass: 'bg-red-600',
    },
    high: {
      label: PRIORITY_LABELS.high,
      textClass: 'text-amber-700',
      barClass: 'bg-amber-500',
    },
    medium: {
      label: PRIORITY_LABELS.medium,
      textClass: 'text-slate-700',
      barClass: 'bg-blue-600',
    },
    low: {
      label: PRIORITY_LABELS.low,
      textClass: 'text-slate-500',
      barClass: 'bg-slate-400',
    },
  };

  const { label, textClass, barClass } = config[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${textClass}`}
    >
      <span
        className={`h-2 w-2 rounded-[2px] shrink-0 ${barClass}`}
        aria-hidden="true"
      />
      {priority === 'critical' && (
        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
}

export function VerifiedMarker({
  verified,
  label = 'Verified',
}: {
  verified?: boolean;
  label?: string;
}) {
  if (!verified) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 whitespace-nowrap shrink-0"
      title={`${label} credential`}
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
