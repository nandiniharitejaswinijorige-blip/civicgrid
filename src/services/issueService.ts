import { INITIAL_ISSUES, INITIAL_PROFILES } from '@/src/data/mockData';
import { SLA_HOURS_BY_PRIORITY, STATUS_LABELS } from '@/src/lib/formatters';
import type {
  CivicIssue,
  CreateIssuePayload,
  IssueStatus,
  KpiSummary,
  StatusTransitionPayload,
  UserProfile,
} from '@/src/types/issue';

const STORAGE_ISSUES_KEY = 'civicgrid_issues_v1';
const STORAGE_PERSONA_KEY = 'civicgrid_active_persona_v1';
const REFERENCE_NOW = '2026-11-23T08:45:00-08:00';

function safeReadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/storage errors in restricted contexts
  }
}

function generateCaseCode(existing: CivicIssue[]): string {
  const maxNum = existing.reduce((max, item) => {
    const match = item.code.match(/CG-(\d+)/);
    const num = match ? parseInt(match[1], 10) : 1040;
    return Math.max(max, num);
  }, 1040);
  return `CG-${maxNum + 1}`;
}

function currentIsoTimestamp(): string {
  return new Date().toISOString();
}

export function computeKpis(issues: CivicIssue[]): KpiSummary {
  const active = issues.filter((i) => i.status !== 'resolved');
  const resolved = issues.filter((i) => i.status === 'resolved');
  const criticalActive = active.filter(
    (i) => i.priority === 'critical' || i.priority === 'high'
  );

  let totalResolutionHours = 0;
  let slaMetCount = 0;

  for (const issue of resolved) {
    const start = new Date(issue.createdAt).getTime();
    const end = new Date(issue.resolvedAt ?? issue.updatedAt).getTime();
    const hours = Math.max(0.2, (end - start) / 3_600_000);
    totalResolutionHours += hours;
    if (hours <= issue.slaHours) {
      slaMetCount += 1;
    }
  }

  const avgResolutionHours =
    resolved.length > 0 ? totalResolutionHours / resolved.length : 0;
  const resolutionRatePercent =
    issues.length > 0 ? Math.round((resolved.length / issues.length) * 100) : 0;
  const slaCompliancePercent =
    resolved.length > 0 ? Math.round((slaMetCount / resolved.length) * 100) : 100;

  return {
    activeCount: active.length,
    criticalActiveCount: criticalActive.length,
    avgResolutionHours,
    totalResolved: resolved.length,
    resolutionRatePercent,
    slaCompliancePercent,
  };
}

export const issueService = {
  async listIssues(): Promise<CivicIssue[]> {
    const stored = safeReadStorage<CivicIssue[] | null>(STORAGE_ISSUES_KEY, null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    safeWriteStorage(STORAGE_ISSUES_KEY, INITIAL_ISSUES);
    return INITIAL_ISSUES;
  },

  async listProfiles(): Promise<UserProfile[]> {
    return INITIAL_PROFILES;
  },

  getActiveProfileId(): string {
    return safeReadStorage<string>(STORAGE_PERSONA_KEY, 'user-steward-1');
  },

  setActiveProfileId(profileId: string): void {
    safeWriteStorage(STORAGE_PERSONA_KEY, profileId);
  },

  async createIssue(
    payload: CreateIssuePayload,
    actor: UserProfile
  ): Promise<CivicIssue[]> {
    const existing = await this.listIssues();
    const now = currentIsoTimestamp();
    const code = generateCaseCode(existing);
    const id = `iss-${Date.now()}`;

    const newIssue: CivicIssue = {
      id,
      code,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      priority: payload.priority,
      status: 'open',
      address: payload.address,
      district: payload.district,
      distanceKm: payload.distanceKm,
      slaHours: SLA_HOURS_BY_PRIORITY[payload.priority],
      createdAt: now,
      updatedAt: now,
      reporterId: actor.id,
      reporterName: actor.name,
      reporterVerified: actor.verified,
      endorsements: 1,
      endorsedByCurrentUser: true,
      attachments: payload.attachments,
      auditLog: [
        {
          id: `aud-${Date.now()}`,
          timestamp: now,
          actorName: actor.name,
          actorRole: actor.role,
          actorVerified: actor.verified,
          actionLabel: 'Issue Reported',
          toStatus: 'open',
          note: `Logged ${payload.priority} priority report at ${payload.address}.`,
        },
      ],
    };

    const next = [newIssue, ...existing];
    safeWriteStorage(STORAGE_ISSUES_KEY, next);
    return next;
  },

  async transitionIssue(
    payload: StatusTransitionPayload,
    actor: UserProfile,
    profiles: UserProfile[]
  ): Promise<CivicIssue[]> {
    const existing = await this.listIssues();
    const now = currentIsoTimestamp();

    const assignee = payload.assigneeId
      ? profiles.find((p) => p.id === payload.assigneeId)
      : undefined;

    const actionLabels: Record<IssueStatus, string> = {
      open: 'Reopened to Queue',
      in_review: 'Triaged / Claimed',
      in_progress: 'Repair In Progress',
      resolved: 'Verified & Resolved',
    };

    const next = existing.map((issue) => {
      if (issue.id !== payload.issueId) return issue;

      const resolvedAt =
        payload.toStatus === 'resolved'
          ? now
          : payload.toStatus === 'open'
            ? undefined
            : issue.resolvedAt;

      const nextAudit = [
        ...issue.auditLog,
        {
          id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: now,
          actorName: actor.name,
          actorRole: actor.role,
          actorVerified: actor.verified,
          actionLabel: actionLabels[payload.toStatus] ?? STATUS_LABELS[payload.toStatus],
          fromStatus: issue.status,
          toStatus: payload.toStatus,
          note: payload.note,
        },
      ];

      return {
        ...issue,
        status: payload.toStatus,
        updatedAt: now,
        resolvedAt,
        assigneeId: assignee ? assignee.id : issue.assigneeId,
        assigneeName: assignee ? assignee.name : issue.assigneeName,
        assigneeOrganization: assignee
          ? assignee.organization
          : issue.assigneeOrganization,
        assigneeVerified: assignee ? assignee.verified : issue.assigneeVerified,
        auditLog: nextAudit,
      };
    });

    safeWriteStorage(STORAGE_ISSUES_KEY, next);
    return next;
  },

  async toggleEndorsement(issueId: string): Promise<CivicIssue[]> {
    const existing = await this.listIssues();
    const next = existing.map((issue) => {
      if (issue.id !== issueId) return issue;
      const nextEndorsed = !issue.endorsedByCurrentUser;
      return {
        ...issue,
        endorsedByCurrentUser: nextEndorsed,
        endorsements: Math.max(0, issue.endorsements + (nextEndorsed ? 1 : -1)),
      };
    });
    safeWriteStorage(STORAGE_ISSUES_KEY, next);
    return next;
  },

  async addAuditNote(
    issueId: string,
    note: string,
    actor: UserProfile
  ): Promise<CivicIssue[]> {
    const existing = await this.listIssues();
    const now = currentIsoTimestamp();
    const next = existing.map((issue) => {
      if (issue.id !== issueId) return issue;
      return {
        ...issue,
        updatedAt: now,
        auditLog: [
          ...issue.auditLog,
          {
            id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: now,
            actorName: actor.name,
            actorRole: actor.role,
            actorVerified: actor.verified,
            actionLabel: 'Field Update',
            note,
          },
        ],
      };
    });
    safeWriteStorage(STORAGE_ISSUES_KEY, next);
    return next;
  },

  async resetDemoData(): Promise<CivicIssue[]> {
    safeWriteStorage(STORAGE_ISSUES_KEY, INITIAL_ISSUES);
    return INITIAL_ISSUES;
  },

  getReferenceNow(): string {
    return REFERENCE_NOW;
  },
};
