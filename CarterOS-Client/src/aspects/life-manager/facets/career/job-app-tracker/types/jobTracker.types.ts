// ===================
// © AngelaMos | 2025
// jobTracker.types.ts
// ===================

import { z } from 'zod'

export const RemoteType = {
  UNKNOWN: 'unknown',
  ONSITE: 'onsite',
  HYBRID: 'hybrid',
  REMOTE: 'remote',
} as const
export type RemoteType = (typeof RemoteType)[keyof typeof RemoteType]

export const ApplicationStatus = {
  UNKNOWN: 'unknown',
  SAVED: 'saved',
  APPLIED: 'applied',
  WITHDRAWN: 'withdrawn',
} as const
export type ApplicationStatus =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus]

export const Outcome = {
  UNKNOWN: 'unknown',
  PENDING: 'pending',
  REJECTED: 'rejected',
  OFFER: 'offer',
  GHOSTED: 'ghosted',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
} as const
export type Outcome = (typeof Outcome)[keyof typeof Outcome]

export const JobType = {
  UNKNOWN: 'unknown',
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  FREELANCE: 'freelance',
} as const
export type JobType = (typeof JobType)[keyof typeof JobType]

export const ExperienceLevel = {
  UNKNOWN: 'unknown',
  ENTRY: 'entry',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  PRINCIPAL: 'principal',
  EXECUTIVE: 'executive',
} as const
export type ExperienceLevel =
  (typeof ExperienceLevel)[keyof typeof ExperienceLevel]

export const Priority = {
  UNKNOWN: 'unknown',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  DREAM: 'dream',
} as const
export type Priority = (typeof Priority)[keyof typeof Priority]

export const JobApplicationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  identity_name: z.string(),
  position_title: z.string(),
  job_url: z.string().nullable(),
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
  offer_amount: z.number().nullable(),
  location: z.string().nullable(),
  remote_type: z.nativeEnum(RemoteType),
  source: z.string().nullable(),
  contact_name: z.string().nullable(),
  contact_email: z.string().nullable(),
  application_status: z.nativeEnum(ApplicationStatus),
  interview_rounds: z.number(),
  outcome: z.nativeEnum(Outcome),
  job_type: z.nativeEnum(JobType),
  experience_level: z.nativeEnum(ExperienceLevel),
  priority: z.nativeEnum(Priority),
  date_saved: z.string().nullable(),
  date_applied: z.string().nullable(),
  date_first_response: z.string().nullable(),
  date_outcome: z.string().nullable(),
  followup_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
})

export type JobApplication = z.infer<typeof JobApplicationSchema>

export const JobApplicationListResponseSchema = z.object({
  items: z.array(JobApplicationSchema),
  total: z.number(),
})

export type JobApplicationListResponse = z.infer<
  typeof JobApplicationListResponseSchema
>

export const JobApplicationStatsSchema = z.object({
  total: z.number(),
  applied: z.number(),
  interviews: z.number(),
  offers: z.number(),
  rejected: z.number(),
  ghosted: z.number(),
})

export type JobApplicationStats = z.infer<typeof JobApplicationStatsSchema>

export interface JobApplicationCreateRequest {
  identity_name: string
  position_title: string
  job_url?: string | null
  salary_min?: number | null
  salary_max?: number | null
  location?: string | null
  remote_type?: RemoteType
  source?: string | null
  contact_name?: string | null
  contact_email?: string | null
  application_status?: ApplicationStatus
  job_type?: JobType
  experience_level?: ExperienceLevel
  priority?: Priority
  date_saved?: string | null
  date_applied?: string | null
  followup_date?: string | null
  notes?: string | null
}

export interface JobApplicationUpdateRequest {
  identity_name?: string | null
  position_title?: string | null
  job_url?: string | null
  salary_min?: number | null
  salary_max?: number | null
  offer_amount?: number | null
  location?: string | null
  remote_type?: RemoteType | null
  source?: string | null
  contact_name?: string | null
  contact_email?: string | null
  application_status?: ApplicationStatus | null
  interview_rounds?: number | null
  outcome?: Outcome | null
  job_type?: JobType | null
  experience_level?: ExperienceLevel | null
  priority?: Priority | null
  date_saved?: string | null
  date_applied?: string | null
  date_first_response?: string | null
  date_outcome?: string | null
  followup_date?: string | null
  notes?: string | null
}

export const isValidJobApplication = (data: unknown): data is JobApplication => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  return JobApplicationSchema.safeParse(data).success
}

export const isValidJobApplicationListResponse = (
  data: unknown
): data is JobApplicationListResponse => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  return JobApplicationListResponseSchema.safeParse(data).success
}

export const isValidJobApplicationStats = (
  data: unknown
): data is JobApplicationStats => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  return JobApplicationStatsSchema.safeParse(data).success
}

export class JobTrackerResponseError extends Error {
  readonly endpoint?: string

  constructor(message: string, endpoint?: string) {
    super(message)
    this.name = 'JobTrackerResponseError'
    this.endpoint = endpoint
    Object.setPrototypeOf(this, JobTrackerResponseError.prototype)
  }
}

export const JOB_TRACKER_ERROR_MESSAGES = {
  INVALID_APPLICATION_RESPONSE: 'Invalid job application data from server',
  INVALID_LIST_RESPONSE: 'Invalid job application list from server',
  INVALID_STATS_RESPONSE: 'Invalid stats data from server',
  APPLICATION_NOT_FOUND: 'Job application not found',
  PERMISSION_DENIED: 'Permission denied',
} as const

export const JOB_TRACKER_SUCCESS_MESSAGES = {
  APPLICATION_CREATED: 'Job application added',
  APPLICATION_UPDATED: 'Job application updated',
  APPLICATION_DELETED: 'Job application deleted',
} as const
