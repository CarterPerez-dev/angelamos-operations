// ===================
// © AngelaMos | 2025
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

export interface NoteFolder {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
  created_at: string
  updated_at: string | null
}

export interface NoteFolderCreate {
  name: string
  parent_id?: string
  sort_order?: number
}

export interface NoteFolderUpdate {
  name?: string
  parent_id?: string
  sort_order?: number
}

export interface Note {
  id: string
  title: string
  content: string
  folder_id: string | null
  sort_order: number
  created_at: string
  updated_at: string | null
}

export interface NoteCreate {
  title: string
  content?: string
  folder_id?: string
  sort_order?: number
}

export interface NoteUpdate {
  title?: string
  content?: string
  folder_id?: string
  sort_order?: number
}

export interface NotesListResponse {
  folders: NoteFolder[]
  notes: Note[]
}
