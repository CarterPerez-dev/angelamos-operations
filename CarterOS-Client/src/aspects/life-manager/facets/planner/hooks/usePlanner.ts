// ===================
// © AngelaMos | 2025
// usePlanner.ts
// ===================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient as api } from '@/core/api'
import { PLANNER_API } from '../types/planner.enums'
import type {
  TimeBlock,
  TimeBlockCreate,
  TimeBlockUpdate,
  TimeBlockListResponse,
  Note,
  NoteCreate,
  NoteUpdate,
  NoteFolder,
  NoteFolderCreate,
  NoteFolderUpdate,
  NotesListResponse,
} from '../types/planner.types'

const QUERY_KEYS = {
  blocks: (date: string) => ['planner', 'blocks', date] as const,
  notes: ['planner', 'notes'] as const,
}

export function useTimeBlocks(date: string) {
  return useQuery({
    queryKey: QUERY_KEYS.blocks(date),
    queryFn: async () => {
      const { data } = await api.get<TimeBlockListResponse>(PLANNER_API.BLOCKS, {
        params: { block_date: date },
      })
      return data
    },
  })
}

export function useCreateBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TimeBlockCreate) => {
      const { data: result } = await api.post<TimeBlock>(PLANNER_API.BLOCKS, data)
      return result
    },
    onSuccess: (newBlock) => {
      const blockDate = newBlock.block_date
      queryClient.setQueryData<TimeBlockListResponse>(QUERY_KEYS.blocks(blockDate), (old) => {
        if (!old) return { items: [newBlock], date: blockDate }
        return { ...old, items: [...old.items, newBlock] }
      })
    },
  })
}

export function useUpdateBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TimeBlockUpdate }) => {
      const { data: result } = await api.put<TimeBlock>(PLANNER_API.BLOCK(id), data)
      return result
    },
    onSuccess: (updatedBlock) => {
      const blockDate = updatedBlock.block_date
      queryClient.setQueryData<TimeBlockListResponse>(QUERY_KEYS.blocks(blockDate), (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)),
        }
      })
    },
  })
}

export function useDeleteBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(PLANNER_API.BLOCK(id))
      return id
    },
    onSuccess: (deletedId, variables) => {
      const queries = queryClient.getQueriesData<TimeBlockListResponse>({ queryKey: ['planner', 'blocks'] })
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData<TimeBlockListResponse>(key, {
            ...data,
            items: data.items.filter((b) => b.id !== deletedId),
          })
        }
      }
    },
  })
}

export function useNotes() {
  return useQuery({
    queryKey: QUERY_KEYS.notes,
    queryFn: async () => {
      const { data } = await api.get<NotesListResponse>(PLANNER_API.NOTES)
      return data
    },
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: NoteCreate) => {
      const { data: result } = await api.post<Note>(PLANNER_API.NOTES, data)
      return result
    },
    onSuccess: (newNote) => {
      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return { ...old, notes: [...old.notes, newNote] }
      })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NoteUpdate }) => {
      const { data: result } = await api.put<Note>(PLANNER_API.NOTE(id), data)
      return result
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          notes: old.notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
        }
      })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(PLANNER_API.NOTE(id))
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          notes: old.notes.filter((n) => n.id !== deletedId),
        }
      })
    },
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: NoteFolderCreate) => {
      const { data: result } = await api.post<NoteFolder>(PLANNER_API.FOLDERS, data)
      return result
    },
    onSuccess: (newFolder) => {
      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return { ...old, folders: [...old.folders, newFolder] }
      })
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NoteFolderUpdate }) => {
      const { data: result } = await api.put<NoteFolder>(PLANNER_API.FOLDER(id), data)
      return result
    },
    onSuccess: (updatedFolder) => {
      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          folders: old.folders.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)),
        }
      })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(PLANNER_API.FOLDER(id))
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          folders: old.folders.filter((f) => f.id !== deletedId),
          notes: old.notes.filter((n) => n.folder_id !== deletedId),
        }
      })
    },
  })
}
