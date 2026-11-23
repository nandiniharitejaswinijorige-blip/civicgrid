export type IssueCategory =
  | 'roadway'
  | 'lighting'
  | 'drainage'
  | 'water'
  | 'signals'
  | 'parks';

export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';

export type IssueStatus = 'open' | 'in_review' | 'in_progress' | 'resolved';

export type UserRole = 'resident' | 'steward' | 'contractor';

export type ActiveView = 'feed' | 'accountability' | 'contractors';

export type SortOption = 'newest' | 'urgency' | 'nearest' | 'endorsed';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  organization: string;
  district: string;
  verified: boolean;
  completionRate: number;
  avgResolutionHours: number;
  resolvedCount: number;
  specialty?: IssueCategory[];
}

export interface MediaAttachment {
  id: string;
  fileName: string;
  url: string;
  caption: string;
  sizeKb: number;
  uploadedAt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  actorVerified: boolean;
  actionLabel: string;
  fromStatus?: IssueStatus;
  toStatus?: IssueStatus;
  note: string;
}

export interface CivicIssue {
  id: string;
  code: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  address: string;
  district: string;
  distanceKm: number;
  slaHours: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  reporterId: string;
  reporterName: string;
  reporterVerified: boolean;
  assigneeId?: string;
  assigneeName?: string;
  assigneeOrganization?: string;
  assigneeVerified?: boolean;
  endorsements: number;
  endorsedByCurrentUser: boolean;
  attachments: MediaAttachment[];
  auditLog: AuditEntry[];
}

export interface IssueFilters {
  search: string;
  category: IssueCategory | 'all';
  priority: IssuePriority | 'all';
  status: IssueStatus | 'all';
  maxRadiusKm: number;
  sortBy: SortOption;
}

export interface KpiSummary {
  activeCount: number;
  criticalActiveCount: number;
  avgResolutionHours: number;
  totalResolved: number;
  resolutionRatePercent: number;
  slaCompliancePercent: number;
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  address: string;
  district: string;
  distanceKm: number;
  attachments: MediaAttachment[];
}

export interface StatusTransitionPayload {
  issueId: string;
  toStatus: IssueStatus;
  note: string;
  assigneeId?: string;
}
