import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Trash2 } from 'lucide-react';
import { DISTRICTS, EVIDENCE_PRESETS } from '@/src/data/mockData';
import { useIssues } from '@/src/context/IssueContext';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SLA_HOURS_BY_PRIORITY,
} from '@/src/lib/formatters';
import {
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  createIssueSchema,
  sanitizeText,
} from '@/src/lib/validation';
import {
  Button,
  EvidenceImage,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/src/components/ui/Primitives';
import type {
  IssueCategory,
  IssuePriority,
  MediaAttachment,
} from '@/src/types/issue';

interface CreateIssueModalProps {
  open: boolean;
  onClose: () => void;
}

type FormErrors = Partial<
  Record<
    'title' | 'description' | 'category' | 'priority' | 'address' | 'district' | 'distanceKm',
    string
  >
>;

export function CreateIssueModal({ open, onClose }: CreateIssueModalProps) {
  const { createIssue, setSelectedIssueId } = useIssues();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('roadway');
  const [priority, setPriority] = useState<IssuePriority>('high');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState<string>(DISTRICTS[0]);
  const [distanceKm, setDistanceKm] = useState<string>('0.8');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setCategory('roadway');
    setPriority('high');
    setAddress('');
    setDistrict(DISTRICTS[0]);
    setDistanceKm('0.8');
    setAttachments([]);
    setErrors({});
    setMediaError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep1 = (): boolean => {
    const step1Check = createIssueSchema
      .pick({ title: true, description: true, category: true, priority: true })
      .safeParse({ title, description, category, priority });

    if (!step1Check.success) {
      const nextErrors: FormErrors = {};
      for (const issue of step1Check.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = (): boolean => {
    const parsedDist = Number(distanceKm);
    const step2Check = createIssueSchema
      .pick({ address: true, district: true, distanceKm: true })
      .safeParse({
        address,
        district,
        distanceKm: Number.isFinite(parsedDist) ? parsedDist : -1,
      });

    if (!step2Check.success) {
      const nextErrors: FormErrors = {};
      for (const issue of step2Check.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length >= 3) {
      setMediaError('You can attach up to 3 evidence photos per report.');
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setMediaError('Only image files (JPG, PNG, WebP) are supported.');
      return;
    }

    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    if (sizeKb > 15360) {
      setMediaError('Image must be smaller than 15 MB.');
      return;
    }

    const url = URL.createObjectURL(file);
    const nextAttachment: MediaAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fileName: sanitizeText(file.name) || 'field_photo.jpg',
      url,
      caption: 'Uploaded field evidence photograph',
      sizeKb,
      uploadedAt: new Date().toISOString(),
    };

    setAttachments((prev) => [...prev, nextAttachment]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddPreset = (presetIdx: number) => {
    setMediaError(null);
    if (attachments.length >= 3) {
      setMediaError('Maximum of 3 attachments reached.');
      return;
    }
    const preset = EVIDENCE_PRESETS[presetIdx];
    if (!preset) return;

    const alreadyAdded = attachments.some(
      (a) => a.url === preset.attachment.url
    );
    if (alreadyAdded) {
      setMediaError('That sample inspection photo is already attached.');
      return;
    }

    setAttachments((prev) => [
      ...prev,
      {
        ...preset.attachment,
        id: `att-preset-${Date.now()}-${presetIdx}`,
        uploadedAt: new Date().toISOString(),
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDist = Number(distanceKm);

    const parsed = createIssueSchema.safeParse({
      title,
      description,
      category,
      priority,
      address,
      district,
      distanceKm: Number.isFinite(parsedDist) ? parsedDist : -1,
      attachments,
    });

    if (!parsed.success) {
      const nextErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createIssue(parsed.data);
      handleClose();
      if (created) {
        setSelectedIssueId(created.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Report Neighborhood Infrastructure Issue"
      subtitle="Verified intake automatically assigns an SLA target and dispatches to district crews."
    >
      {/* Stepper Header */}
      <div className="mb-6 grid grid-cols-3 gap-2 border-b border-slate-200 pb-4">
        {[
          { num: 1, label: '1. Hazard Details' },
          { num: 2, label: '2. Location & Photos' },
          { num: 3, label: '3. Review & Submit' },
        ].map((item) => {
          const active = step === item.num;
          const done = step > item.num;
          return (
            <div key={item.num} className="space-y-1.5">
              <div
                className={`h-1 rounded-full ${
                  done
                    ? 'bg-emerald-600'
                    : active
                      ? 'bg-blue-600'
                      : 'bg-slate-200'
                }`}
              />
              <p
                className={`text-xs font-medium ${
                  active
                    ? 'text-blue-700'
                    : done
                      ? 'text-slate-800'
                      : 'text-slate-400'
                }`}
              >
                {item.label}
              </p>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="issue-title"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                Issue Summary
              </label>
              <Input
                id="issue-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                }}
                placeholder="e.g., Collapsed storm grate near southbound crosswalk"
                maxLength={110}
              />
              {errors.title && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="issue-category"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Category
                </label>
                <Select
                  id="issue-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                >
                  {ISSUE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="issue-priority"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Urgency & Target SLA
                </label>
                <Select
                  id="issue-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IssuePriority)}
                >
                  {ISSUE_PRIORITIES.map((prio) => (
                    <option key={prio} value={prio}>
                      {PRIORITY_LABELS[prio]} ({SLA_HOURS_BY_PRIORITY[prio]}h SLA)
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label
                htmlFor="issue-description"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                Detailed Hazard Description
              </label>
              <Textarea
                id="issue-description"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors((p) => ({ ...p, description: undefined }));
                  }
                }}
                placeholder="Describe exact failure condition, pedestrian or traffic impact, and visible utility markings..."
                maxLength={1000}
              />
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {errors.description ? (
                    <span className="font-medium text-red-600" role="alert">
                      {errors.description}
                    </span>
                  ) : (
                    'Inputs are automatically sanitized before logging.'
                  )}
                </span>
                <span className="font-mono tabular-nums">
                  {description.length}/1000
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="issue-address"
                className="mb-1.5 block text-xs font-medium text-slate-700"
              >
                Street Address or Nearest Intersection
              </label>
              <Input
                id="issue-address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) {
                    setErrors((p) => ({ ...p, address: undefined }));
                  }
                }}
                placeholder="e.g., 1420 E Madison St & 15th Ave"
                maxLength={140}
              />
              {errors.address && (
                <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="issue-district"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  District Sector
                </label>
                <Select
                  id="issue-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="issue-distance"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Distance from Sector Hub (km)
                </label>
                <Input
                  id="issue-distance"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="25"
                  value={distanceKm}
                  onChange={(e) => {
                    setDistanceKm(e.target.value);
                    if (errors.distanceKm) {
                      setErrors((p) => ({ ...p, distanceKm: undefined }));
                    }
                  }}
                />
                {errors.distanceKm && (
                  <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                    {errors.distanceKm}
                  </p>
                )}
              </div>
            </div>

            {/* Simulated Media Attachment Preview */}
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    Photo Evidence (Optional, max 3)
                  </p>
                  <p className="text-xs text-slate-500">
                    Upload a photo or attach a sample inspection image.
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="evidence-upload-input"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Upload Image</span>
                  </Button>
                </div>
              </div>

              {/* Sample preset triggers */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 mr-1">Sample presets:</span>
                {EVIDENCE_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleAddPreset(idx)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 cursor-pointer"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>

              {mediaError && (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {mediaError}
                </p>
              )}

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                    >
                      <div className="relative">
                        <EvidenceImage
                          src={att.url}
                          alt={att.fileName}
                          className="h-24 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((item) => item.id !== att.id)
                            )
                          }
                          className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-slate-900/75 text-white transition-colors hover:bg-red-600"
                          aria-label={`Remove ${att.fileName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="px-2.5 py-1.5">
                        <p className="truncate font-mono text-[11px] text-slate-700">
                          {att.fileName}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400 tabular-nums">
                          {att.sizeKb} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Summary</p>
                <p className="mt-0.5 font-display text-base font-semibold text-slate-900">
                  {sanitizeText(title)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span>{CATEGORY_LABELS[category]}</span>
                <span aria-hidden="true">·</span>
                <span>{PRIORITY_LABELS[priority]} Priority</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">
                  Target SLA: {SLA_HOURS_BY_PRIORITY[priority]}h
                </span>
              </div>

              <p className="text-sm leading-relaxed text-slate-700">
                {sanitizeText(description)}
              </p>

              <div className="border-t border-slate-200 pt-3 text-xs text-slate-600">
                <span className="font-medium text-slate-900">
                  {sanitizeText(address)}
                </span>{' '}
                · {district} ·{' '}
                <span className="font-mono tabular-nums">
                  {Number(distanceKm).toFixed(1)} km
                </span>{' '}
                · {attachments.length}{' '}
                {attachments.length === 1 ? 'photo' : 'photos'} attached
              </div>
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back</span>
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === 1 && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
            >
              <span>Location & Evidence</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}

          {step === 2 && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (validateStep2()) setStep(3);
              }}
            >
              <span>Review Report</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}

          {step === 3 && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
