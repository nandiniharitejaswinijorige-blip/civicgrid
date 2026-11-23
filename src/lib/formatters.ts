import type { IssueCategory, IssuePriority, IssueStatus } from '@/src/types/issue';

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  roadway: 'Roadway & Pavement',
  lighting: 'Street Lighting',
  drainage: 'Storm Drainage',
  water: 'Water Utilities',
  signals: 'Traffic Signals',
  parks: 'Parks & Walkways',
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Open',
  in_review: 'In Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export const PRIORITY_WEIGHT: Record<IssuePriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const SLA_HOURS_BY_PRIORITY: Record<IssuePriority, number> = {
  critical: 6,
  high: 24,
  medium: 72,
  low: 120,
};

export const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  open: ['in_review', 'in_progress'],
  in_review: ['in_progress', 'resolved', 'open'],
  in_progress: ['resolved', 'in_review'],
  resolved: ['in_review'],
};

export function formatRelativeTime(isoTimestamp: string, referenceMs = Date.now()): string {
  const target = new Date(isoTimestamp).getTime();
  const diffMs = Math.max(0, referenceMs - target);
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

export function formatTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDurationHours(hours: number): string {
  if (hours < 1) {
    return `${Math.max(1, Math.round(hours * 60))}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = Math.floor(hours / 24);
  const remHours = Math.round(hours % 24);
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export function getSlaStatusText(
  createdAt: string,
  slaHours: number,
  status: IssueStatus,
  resolvedAt?: string,
  referenceMs = Date.now()
): { label: string; breached: boolean; atRisk: boolean } {
  const start = new Date(createdAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : referenceMs;
  const elapsedHours = Math.max(0, (end - start) / 3_600_000);

  if (status === 'resolved') {
    const breached = elapsedHours > slaHours;
    return {
      label: breached
        ? `Closed in ${formatDurationHours(elapsedHours)} (SLA ${slaHours}h)`
        : `Met ${slaHours}h SLA (${formatDurationHours(elapsedHours)})`,
      breached,
      atRisk: false,
    };
  }

  const remaining = slaHours - elapsedHours;
  if (remaining <= 0) {
    return {
      label: `SLA overdue by ${formatDurationHours(Math.abs(remaining))}`,
      breached: true,
      atRisk: false,
    };
  }

  const atRisk = remaining <= slaHours * 0.25;
  return {
    label: `${formatDurationHours(remaining)} left on ${slaHours}h SLA`,
    breached: false,
    atRisk,
  };
}
