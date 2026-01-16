// ===================
// AngelaMos | 2026
// backups.types.ts
// ===================

import { z } from 'zod'

export const BackupStatusSchema = z.enum(['pending', 'running', 'completed', 'failed'])
export const BackupTriggerSchema = z.string()

export const BackupSchema = z.object({
  id: z.string(),
  database_name: z.string(),
  file_path: z.string(),
  size_bytes: z.number(),
  size_mb: z.number().optional(),
  started_at: z.string(),
  completed_at: z.string().nullable().optional(),
  status: BackupStatusSchema,
  error_message: z.string().nullable().optional(),
  triggered_by: BackupTriggerSchema,
})

export const BackupListResponseSchema = z.array(BackupSchema)

export const CreateBackupRequestSchema = z.object({
  database: z.string(),
})

export const CreateBackupResponseSchema = z.object({
  backup: BackupSchema,
  message: z.string(),
})

export const RestoreBackupResponseSchema = z.object({
  message: z.string(),
  backup_id: z.string(),
  database: z.string(),
})

export type BackupStatus = z.infer<typeof BackupStatusSchema>
export type BackupTrigger = z.infer<typeof BackupTriggerSchema>
export type Backup = z.infer<typeof BackupSchema>
export type BackupListResponse = z.infer<typeof BackupListResponseSchema>
export type CreateBackupRequest = z.infer<typeof CreateBackupRequestSchema>
export type CreateBackupResponse = z.infer<typeof CreateBackupResponseSchema>
export type RestoreBackupResponse = z.infer<typeof RestoreBackupResponseSchema>
