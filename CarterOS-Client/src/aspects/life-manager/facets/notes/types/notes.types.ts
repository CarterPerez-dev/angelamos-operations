// ===================
// © AngelaMos | 2026
// notes.types.ts
// ===================

import { z } from 'zod'

export const noteFolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  parent_id: z.string().uuid().nullable(),
  sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
})

export const noteSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  folder_id: z.string().uuid().nullable(),
  sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
})

export const notesListResponseSchema = z.object({
  folders: z.array(noteFolderSchema),
  notes: z.array(noteSchema),
})

export const deletedNotesListResponseSchema = z.object({
  notes: z.array(noteSchema),
  folders: z.array(noteFolderSchema),
})

export type NoteFolder = z.infer<typeof noteFolderSchema>
export type Note = z.infer<typeof noteSchema>
export type NotesListResponse = z.infer<typeof notesListResponseSchema>
export type DeletedNotesListResponse = z.infer<
  typeof deletedNotesListResponseSchema
>

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

export const isValidNoteFolder = (data: unknown): data is NoteFolder => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  return noteFolderSchema.safeParse(data).success
}

export const isValidNote = (data: unknown): data is Note => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  return noteSchema.safeParse(data).success
}

export const isValidNotesListResponse = (
  data: unknown
): data is NotesListResponse => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  return notesListResponseSchema.safeParse(data).success
}

export const isValidDeletedNotesListResponse = (
  data: unknown
): data is DeletedNotesListResponse => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  return deletedNotesListResponseSchema.safeParse(data).success
}
