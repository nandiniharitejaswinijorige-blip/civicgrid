import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { INITIAL_PROFILES } from '@/src/data/mockData';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useToast } from '@/src/hooks/useToast';
import { PRIORITY_WEIGHT } from '@/src/lib/formatters';
import { computeKpis, issueService } from '@/src/services/issueService';
import type {
  ActiveView,
  CivicIssue,
  CreateIssuePayload,
  IssueFilters,
  KpiSummary,
  StatusTransitionPayload,
  UserProfile,
} from '@/src/types/issue';

const DEFAULT_FILTERS: IssueFilters = {
  search: '',
  category: 'all',
  priority: 'all',
  status: 'all',
  maxRadiusKm: 25,
  sortBy: 'newest',
};

interface IssueContextValue {
  issues: CivicIssue[];
  filteredIssues: CivicIssue[];
  profiles: UserProfile[];
  contractors: UserProfile[];
  activeUser: UserProfile;
  filters: IssueFilters;
  kpis: KpiSummary;
  isLoading: boolean;
  selectedIssueId: string | null;
  selectedIssue: CivicIssue | null;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setSelectedIssueId: (id: string | null) => void;
  setFilters: (updater: Partial<IssueFilters> | ((prev: IssueFilters) => IssueFilters)) => void;
  resetFilters: () => void;
  switchPersona: (profileId: string) => void;
  createIssue: (payload: CreateIssuePayload) => Promise<CivicIssue | null>;
  transitionIssueStatus: (payload: StatusTransitionPayload) => Promise<boolean>;
  toggleEndorsement: (issueId: string) => Promise<void>;
  addAuditNote: (issueId: string, note: string) => Promise<boolean>;
  resetDemoData: () => Promise<void>;
}

const IssueContext = createContext<IssueContextValue | null>(null);

export function IssueProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>(() =>
    issueService.getActiveProfileId()
  );
  const [filters, setFiltersState] = useState<IssueFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('feed');

  const debouncedSearch = useDebounce(filters.search, 220);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const [loadedIssues, loadedProfiles] = await Promise.all([
          issueService.listIssues(),
          issueService.listProfiles(),
        ]);
        if (!active) return;
        setIssues(loadedIssues);
        setProfiles(loadedProfiles);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 260);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const activeUser = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  }, [profiles, activeProfileId]);

  const contractors = useMemo(() => {
    return profiles.filter((p) => p.role === 'contractor' || p.role === 'steward');
  }, [profiles]);

  const setFilters = useCallback(
    (updater: Partial<IssueFilters> | ((prev: IssueFilters) => IssueFilters)) => {
      setFiltersState((prev) =>
        typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      );
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const switchPersona = useCallback(
    (profileId: string) => {
      const target = profiles.find((p) => p.id === profileId);
      if (!target) return;
      setActiveProfileId(profileId);
      issueService.setActiveProfileId(profileId);
      showToast({
        title: `Switched role to ${target.name}`,
        description: `${target.title} · ${target.organization}`,
        variant: 'info',
      });
    },
    [profiles, showToast]
  );

  const createIssue = useCallback(
    async (payload: CreateIssuePayload): Promise<CivicIssue | null> => {
      const updated = await issueService.createIssue(payload, activeUser);
      setIssues(updated);
      const created = updated[0] ?? null;
      if (created) {
        showToast({
          title: `Report ${created.code} submitted`,
          description: `Logged under ${created.district} with a ${created.slaHours}h target SLA.`,
          variant: 'success',
        });
      }
      return created;
    },
    [activeUser, showToast]
  );

  const transitionIssueStatus = useCallback(
    async (payload: StatusTransitionPayload): Promise<boolean> => {
      const updated = await issueService.transitionIssue(payload, activeUser, profiles);
      setIssues(updated);
      const target = updated.find((i) => i.id === payload.issueId);
      showToast({
        title: target ? `${target.code} updated` : 'Status updated',
        description: `Stage changed to ${payload.toStatus.replace('_', ' ')}.`,
        variant: 'success',
      });
      return true;
    },
    [activeUser, profiles, showToast]
  );

  const toggleEndorsement = useCallback(
    async (issueId: string) => {
      const targetBefore = issues.find((i) => i.id === issueId);
      const updated = await issueService.toggleEndorsement(issueId);
      setIssues(updated);
      if (targetBefore) {
        showToast({
          title: targetBefore.endorsedByCurrentUser
            ? `Removed confirmation on ${targetBefore.code}`
            : `Confirmed ${targetBefore.code}`,
          description: targetBefore.endorsedByCurrentUser
            ? 'Community priority count updated.'
            : 'Added neighbor verification to prioritize dispatch.',
          variant: 'info',
        });
      }
    },
    [issues, showToast]
  );

  const addAuditNote = useCallback(
    async (issueId: string, note: string): Promise<boolean> => {
      const updated = await issueService.addAuditNote(issueId, note, activeUser);
      setIssues(updated);
      showToast({
        title: 'Activity log updated',
        description: 'Field note appended to audit trail.',
        variant: 'success',
      });
      return true;
    },
    [activeUser, showToast]
  );

  const resetDemoData = useCallback(async () => {
    setIsLoading(true);
    const reset = await issueService.resetDemoData();
    setIssues(reset);
    setFiltersState(DEFAULT_FILTERS);
    setSelectedIssueId(null);
    setIsLoading(false);
    showToast({
      title: 'District queue restored',
      description: 'Sample municipal reports and audit trails reloaded.',
      variant: 'info',
    });
  }, [showToast]);

  const filteredIssues = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    const matched = issues.filter((issue) => {
      if (filters.status !== 'all' && issue.status !== filters.status) return false;
      if (filters.category !== 'all' && issue.category !== filters.category) return false;
      if (filters.priority !== 'all' && issue.priority !== filters.priority) return false;
      if (issue.distanceKm > filters.maxRadiusKm) return false;

      if (query.length > 0) {
        const haystack = [
          issue.code,
          issue.title,
          issue.description,
          issue.address,
          issue.district,
          issue.assigneeName ?? '',
          issue.reporterName,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    return [...matched].sort((a, b) => {
      switch (filters.sortBy) {
        case 'urgency': {
          const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
          if (weightDiff !== 0) return weightDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        case 'nearest':
          return a.distanceKm - b.distanceKm;
        case 'endorsed':
          return b.endorsements - a.endorsements;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [issues, debouncedSearch, filters]);

  const kpis = useMemo(() => computeKpis(issues), [issues]);

  const selectedIssue = useMemo(() => {
    if (!selectedIssueId) return null;
    return issues.find((i) => i.id === selectedIssueId) ?? null;
  }, [issues, selectedIssueId]);

  const value = useMemo<IssueContextValue>(
    () => ({
      issues,
      filteredIssues,
      profiles,
      contractors,
      activeUser,
      filters,
      kpis,
      isLoading,
      selectedIssueId,
      selectedIssue,
      activeView,
      setActiveView,
      setSelectedIssueId,
      setFilters,
      resetFilters,
      switchPersona,
      createIssue,
      transitionIssueStatus,
      toggleEndorsement,
      addAuditNote,
      resetDemoData,
    }),
    [
      issues,
      filteredIssues,
      profiles,
      contractors,
      activeUser,
      filters,
      kpis,
      isLoading,
      selectedIssueId,
      selectedIssue,
      activeView,
      setFilters,
      resetFilters,
      switchPersona,
      createIssue,
      transitionIssueStatus,
      toggleEndorsement,
      addAuditNote,
      resetDemoData,
    ]
  );

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>;
}

export function useIssues(): IssueContextValue {
  const ctx = useContext(IssueContext);
  if (!ctx) {
    throw new Error('useIssues must be used within IssueProvider');
  }
  return ctx;
}
