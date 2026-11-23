import { z } from 'zod';
import type { IssueCategory, IssuePriority, IssueStatus } from '@/src/types/issue';

export function sanitizeText(raw: string): string {
  return raw
    .replace(/[<>]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const ISSUE_CATEGORIES: readonly IssueCategory[] = [
  'roadway',
  'lighting',
  'drainage',
  'water',
  'signals',
  'parks',
] as const;

export const ISSUE_PRIORITIES: readonly IssuePriority[] = [
  'critical',
  'high',
  'medium',
  'low',
] as const;

export const ISSUE_STATUSES: readonly IssueStatus[] = [
  'open',
  'in_review',
  'in_progress',
  'resolved',
] as const;

export const mediaAttachmentSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1).max(120),
  url: z.string().min(1),
  caption: z.string().max(180).transform(sanitizeText),
  sizeKb: z.number().min(1).max(15360),
  uploadedAt: z.string().min(1),
});

export const createIssueSchema = z.object({
  title: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(8, 'Enter a clear summary of at least 8 characters.')
        .max(110, 'Keep the summary under 110 characters.')
    ),
  description: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(20, 'Provide at least 20 characters describing exact hazard conditions.')
        .max(1000, 'Description must be under 1,000 characters.')
    ),
  category: z.enum(['roadway', 'lighting', 'drainage', 'water', 'signals', 'parks'], {
    error: 'Select an infrastructure category.',
  }),
  priority: z.enum(['critical', 'high', 'medium', 'low'], {
    error: 'Select an urgency level.',
  }),
  address: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(5, 'Enter a street address or nearest intersection.')
        .max(140, 'Address must be under 140 characters.')
    ),
  district: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2, 'Select a neighborhood district.')),
  distanceKm: z
    .number({ error: 'Distance must be a valid number.' })
    .min(0.1, 'Distance must be at least 0.1 km.')
    .max(25, 'Distance must be within 25 km.'),
  attachments: z.array(mediaAttachmentSchema).max(3, 'Attach up to 3 photos.'),
});

export const transitionStatusSchema = z.object({
  issueId: z.string().min(1),
  toStatus: z.enum(['open', 'in_review', 'in_progress', 'resolved']),
  note: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(8, 'Add a brief verification or field note (min 8 characters).')
        .max(400, 'Note must be under 400 characters.')
    ),
  assigneeId: z.string().optional(),
});

export const auditNoteSchema = z.object({
  note: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(4, 'Comment must be at least 4 characters.')
        .max(400, 'Comment must be under 400 characters.')
    ),
});
