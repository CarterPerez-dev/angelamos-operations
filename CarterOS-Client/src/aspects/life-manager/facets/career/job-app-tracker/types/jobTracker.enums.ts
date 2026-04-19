// ===================
// © AngelaMos | 2025
// jobTracker.enums.ts
// ===================

import type {
  ApplicationStatus,
  ExperienceLevel,
  JobType,
  Outcome,
  Priority,
  RemoteType,
} from './jobTracker.types'

export interface EnumOption<T> {
  value: T
  label: string
}

export const REMOTE_TYPE_OPTIONS: EnumOption<RemoteType>[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
] as const

export const APPLICATION_STATUS_OPTIONS: EnumOption<ApplicationStatus>[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'withdrawn', label: 'Withdrawn' },
] as const

export const OUTCOME_OPTIONS: EnumOption<Outcome>[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'offer', label: 'Offer' },
  { value: 'ghosted', label: 'Ghosted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
] as const

export const JOB_TYPE_OPTIONS: EnumOption<JobType>[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
] as const

export const EXPERIENCE_LEVEL_OPTIONS: EnumOption<ExperienceLevel>[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
  { value: 'executive', label: 'Executive' },
] as const

export const PRIORITY_OPTIONS: EnumOption<Priority>[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'dream', label: 'Dream' },
] as const

export const OUTCOME_COLORS: Record<Outcome, string> = {
  unknown: 'var(--color-text-tertiary)',
  pending: 'var(--color-warning)',
  rejected: 'var(--color-error)',
  offer: 'var(--color-success)',
  ghosted: 'var(--color-text-tertiary)',
  accepted: 'var(--color-success)',
  declined: 'var(--color-text-secondary)',
} as const

export const PRIORITY_COLORS: Record<Priority, string> = {
  unknown: 'var(--color-text-tertiary)',
  low: 'var(--color-text-secondary)',
  medium: 'var(--color-warning)',
  high: 'var(--color-error)',
  dream: 'var(--color-accent)',
} as const
