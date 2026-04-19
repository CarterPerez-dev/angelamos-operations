// ===================
// © AngelaMos | 2026
// checklist.types.ts
// ===================

import { z } from 'zod'

export const ChecklistItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  sort_order: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
})

export const ChecklistItemListResponseSchema = z.object({
  items: z.array(ChecklistItemSchema),
})

export const ChecklistLogEntrySchema = z.object({
  id: z.string().uuid(),
  item_id: z.string().uuid(),
  log_date: z.string(),
  completed: z.boolean(),
  note: z.string().nullable(),
  item_title: z.string(),
  item_sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
})

export const ChecklistDayResponseSchema = z.object({
  date: z.string(),
  entries: z.array(ChecklistLogEntrySchema),
  completed_count: z.number(),
  total_count: z.number(),
})

export const HeatmapDaySchema = z.object({
  date: z.string(),
  completed_count: z.number(),
  total_count: z.number(),
})

export const ItemStatSchema = z.object({
  item_id: z.string().uuid(),
  title: z.string(),
  completion_rate: z.number(),
})

export const ChecklistStatsResponseSchema = z.object({
  streak: z.number(),
  item_stats: z.array(ItemStatSchema),
  heatmap: z.array(HeatmapDaySchema),
})

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>
export type ChecklistItemListResponse = z.infer<
  typeof ChecklistItemListResponseSchema
>
export type ChecklistLogEntry = z.infer<typeof ChecklistLogEntrySchema>
export type ChecklistDayResponse = z.infer<typeof ChecklistDayResponseSchema>
export type HeatmapDay = z.infer<typeof HeatmapDaySchema>
export type ItemStat = z.infer<typeof ItemStatSchema>
export type ChecklistStatsResponse = z.infer<typeof ChecklistStatsResponseSchema>

export interface ChecklistItemCreateRequest {
  title: string
  sort_order?: number
}

export interface ChecklistItemUpdateRequest {
  title?: string
  sort_order?: number
}

export interface ChecklistLogUpdateRequest {
  completed: boolean
  note?: string | null
}
