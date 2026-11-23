import { RotateCcw, Search, X } from 'lucide-react';
import { useIssues } from '@/src/context/IssueContext';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '@/src/lib/formatters';
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, ISSUE_STATUSES } from '@/src/lib/validation';
import { Input, Select } from '@/src/components/ui/Primitives';
import type { IssueCategory, IssuePriority, IssueStatus, SortOption } from '@/src/types/issue';

export function FilterBar() {
  const { issues, filteredIssues, filters, setFilters, resetFilters } = useIssues();

  const statusCounts = ISSUE_STATUSES.reduce<Record<IssueStatus, number>>(
    (acc, status) => {
      acc[status] = issues.filter((item) => item.status === status).length;
      return acc;
    },
    { open: 0, in_review: 0, in_progress: 0, resolved: 0 }
  );

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.category !== 'all' ||
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.maxRadiusKm !== 25 ||
    filters.sortBy !== 'newest';

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      {/* Row 1: Segmented Status Tabs + Result Count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter by resolution stage"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === 'all'}
            onClick={() => setFilters({ status: 'all' })}
            className={`h-8 rounded-md px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filters.status === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All <span className="ml-1 font-mono text-slate-400 tabular-nums">{issues.length}</span>
          </button>

          {ISSUE_STATUSES.map((status) => {
            const active = filters.status === status;
            return (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilters({ status })}
                className={`h-8 rounded-md px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {STATUS_LABELS[status]}{' '}
                <span className="ml-1 font-mono text-slate-400 tabular-nums">
                  {statusCounts[status]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-mono tabular-nums">
            Showing {filteredIssues.length} of {issues.length}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 font-medium text-blue-600 transition-colors hover:text-blue-700 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Debounced Search & Multi-Criteria Controls */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
        <div className="relative lg:col-span-4">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Search ID, street, hazard, or crew..."
            aria-label="Search neighborhood issues"
            className="pl-9 pr-8"
          />
          {filters.search.length > 0 && (
            <button
              type="button"
              onClick={() => setFilters({ search: '' })}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="lg:col-span-2">
          <Select
            aria-label="Filter by category"
            value={filters.category}
            onChange={(e) =>
              setFilters({ category: e.target.value as IssueCategory | 'all' })
            }
          >
            <option value="all">All Categories</option>
            {ISSUE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select
            aria-label="Filter by urgency"
            value={filters.priority}
            onChange={(e) =>
              setFilters({ priority: e.target.value as IssuePriority | 'all' })
            }
          >
            <option value="all">All Urgencies</option>
            {ISSUE_PRIORITIES.map((prio) => (
              <option key={prio} value={prio}>
                {PRIORITY_LABELS[prio]} Priority
              </option>
            ))}
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select
            aria-label="Filter by location radius"
            value={String(filters.maxRadiusKm)}
            onChange={(e) =>
              setFilters({ maxRadiusKm: Number(e.target.value) })
            }
          >
            <option value="1">Within 1 km</option>
            <option value="3">Within 3 km</option>
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="25">All Distances</option>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select
            aria-label="Sort issues"
            value={filters.sortBy}
            onChange={(e) => setFilters({ sortBy: e.target.value as SortOption })}
          >
            <option value="newest">Sort: Newest</option>
            <option value="urgency">Sort: Urgency</option>
            <option value="nearest">Sort: Nearest</option>
            <option value="endorsed">Sort: Most Confirmed</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
