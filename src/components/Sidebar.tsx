import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Layers,
  Plus,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useIssues } from '@/src/context/IssueContext';
import type { ActiveView } from '@/src/types/issue';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCreate: () => void;
}

const NAV_ITEMS: ReadonlyArray<{
  id: ActiveView;
  label: string;
  mobileLabel: string;
  Icon: typeof Layers;
}> = [
  {
    id: 'feed',
    label: 'Dispatch Feed',
    mobileLabel: 'Feed',
    Icon: Layers,
  },
  {
    id: 'accountability',
    label: 'SLA & Audit',
    mobileLabel: 'SLAs',
    Icon: BarChart3,
  },
  {
    id: 'contractors',
    label: 'Contractors',
    mobileLabel: 'Crews',
    Icon: Users,
  },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onOpenCreate,
}: SidebarProps) {
  const {
    activeView,
    setActiveView,
    activeUser,
    profiles,
    switchPersona,
    resetDemoData,
  } = useIssues();

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 ${
          collapsed ? 'w-[72px]' : 'w-[264px]'
        }`}
        aria-label="Primary navigation"
      >
        {/* Brand Row */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <button
            type="button"
            onClick={() => setActiveView('feed')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-display text-sm font-bold">
              CG
            </div>
            {!collapsed && (
              <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
                CivicGrid
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveView(id)}
                className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? label : undefined}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Active Role / Persona Switcher & Reset */}
        <div className="border-t border-slate-200 p-3">
          {!collapsed ? (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="desktop-persona-select"
                  className="block text-xs font-medium text-slate-500"
                >
                  Active Role
                </label>
                <select
                  id="desktop-persona-select"
                  value={activeUser.id}
                  onChange={(e) => switchPersona(e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                >
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} ({profile.role})
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">{activeUser.organization}</span>
                  {activeUser.verified && (
                    <ShieldCheck
                      className="h-3.5 w-3.5 shrink-0 text-blue-600"
                      aria-label="Verified profile"
                    />
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={resetDemoData}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Queue</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={resetDemoData}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
                title="Reset Queue"
                aria-label="Reset Queue"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Compact Bottom Navigation Bar (<= 56px height) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t border-slate-200 bg-white px-2 lg:hidden"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(({ id, mobileLabel, Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
              className={`flex h-11 min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{mobileLabel}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenCreate}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Report</span>
        </button>
      </nav>
    </>
  );
}
