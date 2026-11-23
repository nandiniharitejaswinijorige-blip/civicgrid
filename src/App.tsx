import { useState } from 'react';
import { ClipboardList, Plus, RotateCcw } from 'lucide-react';
import { ToastProvider } from '@/src/hooks/useToast';
import { IssueProvider, useIssues } from '@/src/context/IssueContext';
import { Sidebar } from '@/src/components/Sidebar';
import { KpiBar } from '@/src/components/KpiBar';
import { FilterBar } from '@/src/components/FilterBar';
import { IssueCard } from '@/src/components/IssueCard';
import { IssueDetailDrawer } from '@/src/components/IssueDetailDrawer';
import { CreateIssueModal } from '@/src/components/CreateIssueModal';
import { AccountabilityView } from '@/src/components/AccountabilityView';
import { ContractorsView } from '@/src/components/ContractorsView';
import { Button, Skeleton } from '@/src/components/ui/Primitives';
import type { ActiveView } from '@/src/types/issue';

const VIEW_TITLES: Record<ActiveView, string> = {
  feed: 'Live Dispatch Queue',
  accountability: 'SLA & Audit Trail',
  contractors: 'Verified Crews',
};

function WorkspaceShell() {
  const {
    filteredIssues,
    issues,
    isLoading,
    activeView,
    activeUser,
    profiles,
    switchPersona,
    setSelectedIssueId,
    toggleEndorsement,
    resetFilters,
  } = useIssues();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onOpenCreate={() => setCreateModalOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        {/* Workspace Header */}
        <header className="sticky top-0 z-30 flex h-13 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:h-16 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="font-display font-bold text-slate-900 lg:hidden whitespace-nowrap shrink-0">
              CivicGrid
            </span>
            <span className="text-slate-300 lg:hidden" aria-hidden="true">
              /
            </span>
            <span className="hidden text-slate-500 sm:inline whitespace-nowrap shrink-0">
              Metro District 4
            </span>
            <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
              /
            </span>
            <h1 className="truncate font-display text-sm font-semibold text-slate-900 sm:text-base">
              {VIEW_TITLES[activeView]}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Compact mobile role selector */}
            <select
              aria-label="Switch active role"
              value={activeUser.id}
              onChange={(e) => switchPersona(e.target.value)}
              className="h-9 max-w-[140px] rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-800 lg:hidden"
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              className="hidden sm:inline-flex"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Report Issue</span>
            </Button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <KpiBar />

          {activeView === 'feed' && (
            <div className="space-y-4">
              <FilterBar />

              {isLoading ? (
                <div className="space-y-3" aria-label="Loading dispatch queue">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2.5">
                          <Skeleton className="h-5 w-2/3" />
                          <Skeleton className="h-3.5 w-1/2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                        <Skeleton className="h-16 w-24 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                    <ClipboardList className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-base font-semibold text-slate-900">
                    {issues.length === 0
                      ? 'No infrastructure reports logged'
                      : 'No matching reports in this view'}
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    {issues.length === 0
                      ? 'Submit the first neighborhood hazard report to initiate dispatch tracking and SLA monitoring.'
                      : 'Try widening your location radius, clearing the search query, or switching back to all statuses.'}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {issues.length > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetFilters}
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        <span>Reset Filters</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setCreateModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>Report Issue</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3" aria-label="Neighborhood issue feed">
                  {filteredIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onSelect={(id) => setSelectedIssueId(id)}
                      onToggleEndorse={(id) => toggleEndorsement(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === 'accountability' && <AccountabilityView />}
          {activeView === 'contractors' && <ContractorsView />}
        </main>
      </div>

      <IssueDetailDrawer />
      <CreateIssueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <IssueProvider>
        <WorkspaceShell />
      </IssueProvider>
    </ToastProvider>
  );
}
