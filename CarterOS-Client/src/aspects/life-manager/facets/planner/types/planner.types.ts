// ===================
// © AngelaMos | 2026
// planner.types.ts
// ===================

export interface TimeBlock {
  id: string
  block_date: string
  start_time: string
  end_time: string
  title: string
  description: string | null
  color: string | null
  sort_order: number
  created_at: string
  updated_at: string | null
}

export interface TimeBlockCreate {
  block_date?: string
  start_time: string
  end_time: string
  title: string
  description?: string
  color?: string
  sort_order?: number
}

export interface TimeBlockUpdate {
  start_time?: string
  end_time?: string
  title?: string
  description?: string
  color?: string
  sort_order?: number
}

export interface TimeBlockListResponse {
  items: TimeBlock[]
  date: string
}

export const TIME_BLOCK_COLORS = [
  { key: 'blue', label: 'Blue', value: 'hsl(210, 100%, 50%)' },
  { key: 'green', label: 'Green', value: 'hsl(142, 76%, 45%)' },
  { key: 'amber', label: 'Amber', value: 'hsl(45, 100%, 50%)' },
  { key: 'red', label: 'Red', value: 'hsl(0, 100%, 50%)' },
  { key: 'purple', label: 'Purple', value: 'hsl(270, 100%, 50%)' },
] as const
