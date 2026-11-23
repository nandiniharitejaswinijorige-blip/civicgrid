import { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  MapPin,
  MessageSquarePlus,
  ThumbsUp,
  UserCheck,
  X,
} from 'lucide-react';
import { useIssues } from '@/src/context/IssueContext';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  VALID_TRANSITIONS,
  formatTimestamp,
  getSlaStatusText,
} from '@/src/lib/formatters';
import { auditNoteSchema, transitionStatusSchema } from '@/src/lib/validation';
import {
  PriorityLabel,
  StatusLabel,
  VerifiedMarker,
} from '@/src/components/StatusIndicators';
import {
  Button,
  Drawer,
  EvidenceImage,
  Select,
  Textarea,
} from '@/src/components/ui/Primitives';
import type { IssueStatus } from '@/src/types/issue';

const LIFECYCLE_STAGES: readonly IssueStatus[] = [
  'open',
  'in_review',
  'in_progress',
  'resolved',
] as const;

export function IssueDetailDrawer() {
  const {
    selectedIssue,
    setSelectedIssueId,
    contractors,
    transitionIssueStatus,
    toggleEndorsement,
    addAuditNote,
  } = useIssues();

  const [targetStatus, setTargetStatus] = useState<IssueStatus>('in_review');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [transitionNote, setTransitionNote] = useState<string>('');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [isSubmittingTransition, setIsSubmittingTransition] = useState(false);

  const [quickNote, setQuickNote] = useState<string>('');
  const [quickNoteError, setQuickNoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedIssue) return;
    const validNext = VALID_TRANSITIONS[selectedIssue.status];
    setTargetStatus(validNext[0] ?? 'resolved');
    setAssigneeId(selectedIssue.assigneeId ?? '');
    setTransitionNote('');
    setTransitionError(null);
    setQuickNote('');
    setQuickNoteError(null);
  }, [selectedIssue?.id, selectedIssue?.status, selectedIssue?.assigneeId]);

  if (!selectedIssue) return null;

  const validNextStatuses = VALID_TRANSITIONS[selectedIssue.status];
  const currentStageIdx = LIFECYCLE_STAGES.indexOf(selectedIssue.status);
  const sla = getSlaStatusText(
    selectedIssue.createdAt,
    selectedIssue.slaHours,
    selectedIssue.status,
    selectedIssue.resolvedAt
  );

  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransitionError(null);

    const parsed = transitionStatusSchema.safeParse({
      issueId: selectedIssue.id,
      toStatus: targetStatus,
      note: transitionNote,
      assigneeId: assigneeId || undefined,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setTransitionError(firstIssue?.message ?? 'Check status update fields.');
      return;
    }

    setIsSubmittingTransition(true);
    try {
      await transitionIssueStatus(parsed.data);
      setTransitionNote('');
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  const handleQuickNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickNoteError(null);

    const parsed = auditNoteSchema.safeParse({ note: quickNote });
    if (!parsed.success) {
      setQuickNoteError(parsed.error.issues[0]?.message ?? 'Enter a valid note.');
      return;
    }

    await addAuditNote(selectedIssue.id, parsed.data.note);
    setQuickNote('');
  };

  return (
    <Drawer
      open={Boolean(selectedIssue)}
      onClose={() => setSelectedIssueId(null)}
      title={`Issue ${selectedIssue.code} Details`}
    >
      {/* Sticky Drawer Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-900">
              {selectedIssue.code}
            </span>
            <span aria-hidden="true">·</span>
            <span>{CATEGORY_LABELS[selectedIssue.category]}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Reported {formatTimestamp(selectedIssue.createdAt)}
            </span>
          </div>
          <h2 className="mt-1 font-display text-lg font-semibold leading-snug text-slate-900">
            {selectedIssue.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setSelectedIssueId(null)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
          aria-label="Close issue drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        {/* Status, Priority, SLA & Endorse Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <StatusLabel status={selectedIssue.status} />
            <PriorityLabel priority={selectedIssue.priority} />
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-xs tabular-nums ${
                sla.breached
                  ? 'font-medium text-red-600'
                  : sla.atRisk
                    ? 'font-medium text-amber-700'
                    : 'text-slate-600'
              }`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{sla.label}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleEndorsement(selectedIssue.id)}
            aria-pressed={selectedIssue.endorsedByCurrentUser}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer ${
              selectedIssue.endorsedByCurrentUser
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {selectedIssue.endorsedByCurrentUser ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {selectedIssue.endorsedByCurrentUser ? 'Confirmed' : 'Confirm Issue'}
            </span>
            <span className="font-mono tabular-nums">
              ({selectedIssue.endorsements})
            </span>
          </button>
        </div>

        {/* Lifecycle State Machine Progress */}
        <section aria-label="Resolution lifecycle stage">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500">
            Resolution Lifecycle
          </h3>
          <ol className="mt-3 grid grid-cols-4 gap-2">
            {LIFECYCLE_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIdx;
              const isCurrent = index === currentStageIdx;
              return (
                <li key={stage} className="space-y-1.5">
                  <div
                    className={`h-1.5 w-full rounded-full ${
                      isCompleted
                        ? 'bg-emerald-600'
                        : isCurrent
                          ? 'bg-blue-600'
                          : 'bg-slate-200'
                    }`}
                  />
                  <p
                    className={`text-xs font-medium ${
                      isCurrent
                        ? 'text-blue-700'
                        : isCompleted
                          ? 'text-slate-800'
                          : 'text-slate-400'
                    }`}
                  >
                    {STATUS_LABELS[stage]}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Description & Location */}
        <section className="space-y-3 border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
              <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>{selectedIssue.address}</span>
            </span>
            <span className="text-slate-400">·</span>
            <span>{selectedIssue.district}</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {selectedIssue.distanceKm.toFixed(1)} km away
            </span>
          </div>

          <p className="text-sm leading-relaxed text-slate-700">
            {selectedIssue.description}
          </p>

          <div className="grid grid-cols-1 gap-3 pt-2 text-xs text-slate-600 sm:grid-cols-2">
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="text-slate-500">Reporter</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
                <span>{selectedIssue.reporterName}</span>
                <VerifiedMarker verified={selectedIssue.reporterVerified} />
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="text-slate-500">Assigned Crew</span>
              {selectedIssue.assigneeName ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
                  <span>{selectedIssue.assigneeName}</span>
                  <VerifiedMarker verified={selectedIssue.assigneeVerified} />
                </span>
              ) : (
                <span className="text-slate-400">Unassigned</span>
              )}
            </div>
          </div>
        </section>

        {/* Photo Evidence */}
        {selectedIssue.attachments.length > 0 && (
          <section className="space-y-3 border-t border-slate-200 pt-5">
            <h3 className="text-xs font-semibold text-slate-500">
              Field Evidence ({selectedIssue.attachments.length})
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {selectedIssue.attachments.map((att) => (
                <figure
                  key={att.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  <EvidenceImage
                    src={att.url}
                    alt={att.caption || att.fileName}
                    className="h-44 w-full object-cover"
                  />
                  <figcaption className="border-t border-slate-200 bg-white px-3 py-2">
                    <p className="text-xs text-slate-700">
                      {att.caption || 'Field inspection photograph'}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400 tabular-nums">
                      {att.fileName} · {att.sizeKb} KB
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Lifecycle Transition & Contractor Dispatch Form */}
        <section className="border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Update Resolution Stage
            </h3>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Audit-logged transition</span>
            </span>
          </div>

          <form onSubmit={handleTransitionSubmit} className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="transition-stage"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  Next Lifecycle Stage
                </label>
                <Select
                  id="transition-stage"
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as IssueStatus)}
                >
                  {validNextStatuses.map((status) => (
                    <option key={status} value={status}>
                      Move to {STATUS_LABELS[status]}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="transition-assignee"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  Assign Verified Crew
                </label>
                <Select
                  id="transition-assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">Keep current / Unassigned</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.organization}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label
                htmlFor="transition-note"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Resolution / Dispatch Note
              </label>
              <Textarea
                id="transition-note"
                rows={2}
                value={transitionNote}
                onChange={(e) => {
                  setTransitionNote(e.target.value);
                  if (transitionError) setTransitionError(null);
                }}
                placeholder="Document inspection findings, parts deployed, or repair sign-off..."
              />
              {transitionError && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {transitionError}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmittingTransition}
              >
                {isSubmittingTransition
                  ? 'Updating...'
                  : `Advance to ${STATUS_LABELS[targetStatus]}`}
              </Button>
            </div>
          </form>
        </section>

        {/* Audit Trail / Activity Log */}
        <section className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Audit Trail ({selectedIssue.auditLog.length})
          </h3>

          <ol className="mt-4 space-y-4">
            {[...selectedIssue.auditLog].reverse().map((entry) => (
              <li
                key={entry.id}
                className="border-b border-slate-100 pb-3.5 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-900">
                      {entry.actionLabel}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-700">{entry.actorName}</span>
                    <VerifiedMarker verified={entry.actorVerified} />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>

                {entry.fromStatus && entry.toStatus && (
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    {STATUS_LABELS[entry.fromStatus]} → {STATUS_LABELS[entry.toStatus]}
                  </p>
                )}

                <p className="mt-1.5 text-sm text-slate-600">{entry.note}</p>
              </li>
            ))}
          </ol>

          {/* Append Field Comment */}
          <form onSubmit={handleQuickNoteSubmit} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <label
              htmlFor="quick-audit-note"
              className="block text-xs font-medium text-slate-700"
            >
              Add Field Observation
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Textarea
                id="quick-audit-note"
                rows={1}
                value={quickNote}
                onChange={(e) => {
                  setQuickNote(e.target.value);
                  if (quickNoteError) setQuickNoteError(null);
                }}
                placeholder="Log site access update or neighbor verification..."
                className="min-h-[40px] flex-1 resize-none py-2"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                <span>Add Note</span>
              </Button>
            </div>
            {quickNoteError && (
              <p className="text-xs font-medium text-red-600" role="alert">
                {quickNoteError}
              </p>
            )}
          </form>
        </section>
      </div>
    </Drawer>
  );
}
