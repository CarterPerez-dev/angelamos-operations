// ===================
// © AngelaMos | 2026
// useNotes.ts
// ===================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config'
import { apiClient as api } from '@/core/api'
import type {
  DeletedNotesListResponse,
  Note,
  NoteCreate,
  NoteFolder,
  NoteFolderCreate,
  NoteFolderUpdate,
  NotesListResponse,
  NoteUpdate,
} from '../types/notes.types'

const NOTES_API = API_ENDPOINTS.NOTES

const QUERY_KEYS = {
  notes: ['notes'] as const,
  deleted: ['notes', 'deleted'] as const,
}

export function useNotes() {
  return useQuery({
    queryKey: QUERY_KEYS.notes,
    queryFn: async () => {
      const { data } = await api.get<NotesListResponse>(NOTES_API.NOTES)
      return data
    },
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: NoteCreate) => {
      const { data: result } = await api.post<Note>(NOTES_API.NOTES, data)
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
      const { data: result } = await api.put<Note>(NOTES_API.NOTE(id), data)
      return result
    },
    onSuccess: (updatedNote) => {
      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          notes: old.notes.map((n) =>
            n.id === updatedNote.id ? updatedNote : n
          ),
        }
      })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(NOTES_API.NOTE(id))
      return id
    },
    onSuccess: (deletedId) => {
      const deletedNote = queryClient
        .getQueryData<NotesListResponse>(QUERY_KEYS.notes)
        ?.notes.find((n) => n.id === deletedId)

      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          notes: old.notes.filter((n) => n.id !== deletedId),
        }
      })

      if (deletedNote) {
        queryClient.setQueryData<DeletedNotesListResponse>(
          QUERY_KEYS.deleted,
          (old) => {
            if (!old)
              return {
                notes: [{ ...deletedNote, deleted_at: new Date().toISOString() }],
                folders: [],
              }
            return {
              ...old,
              notes: [
                { ...deletedNote, deleted_at: new Date().toISOString() },
                ...old.notes,
              ],
            }
          }
        )
      }
    },
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: NoteFolderCreate) => {
      const { data: result } = await api.post<NoteFolder>(NOTES_API.FOLDERS, data)
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
      const { data: result } = await api.put<NoteFolder>(
        NOTES_API.FOLDER(id),
        data
      )
      return result
    },
    onSuccess: (updatedFolder) => {
      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          folders: old.folders.map((f) =>
            f.id === updatedFolder.id ? updatedFolder : f
          ),
        }
      })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(NOTES_API.FOLDER(id))
      return id
    },
    onSuccess: (deletedId) => {
      const notesData = queryClient.getQueryData<NotesListResponse>(
        QUERY_KEYS.notes
      )
      const deletedFolder = notesData?.folders.find((f) => f.id === deletedId)
      const deletedFolderNotes =
        notesData?.notes.filter((n) => n.folder_id === deletedId) || []

      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          folders: old.folders.filter((f) => f.id !== deletedId),
          notes: old.notes.filter((n) => n.folder_id !== deletedId),
        }
      })

      queryClient.setQueryData<DeletedNotesListResponse>(
        QUERY_KEYS.deleted,
        (old) => {
          const now = new Date().toISOString()
          const notesWithTimestamp = deletedFolderNotes.map((n) => ({
            ...n,
            deleted_at: now,
          }))
          const folderWithTimestamp = deletedFolder
            ? { ...deletedFolder, deleted_at: now }
            : null

          if (!old) {
            return {
              notes: notesWithTimestamp,
              folders: folderWithTimestamp ? [folderWithTimestamp] : [],
            }
          }

          return {
            ...old,
            notes: [...notesWithTimestamp, ...old.notes],
            folders: folderWithTimestamp
              ? [folderWithTimestamp, ...old.folders]
              : old.folders,
          }
        }
      )
    },
  })
}

export function useDeletedNotes() {
  return useQuery({
    queryKey: QUERY_KEYS.deleted,
    queryFn: async () => {
      const { data } = await api.get<DeletedNotesListResponse>(NOTES_API.DELETED)
      return data
    },
  })
}

export function useRestoreNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<Note>(NOTES_API.RESTORE(id))
      return data
    },
    onSuccess: (restoredNote) => {
      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          notes: [...old.notes, { ...restoredNote, deleted_at: null }],
        }
      })

      queryClient.setQueryData<DeletedNotesListResponse>(
        QUERY_KEYS.deleted,
        (old) => {
          if (!old) return old
          return {
            ...old,
            notes: old.notes.filter((n) => n.id !== restoredNote.id),
          }
        }
      )
    },
  })
}

export function usePermanentDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(NOTES_API.PERMANENT_DELETE(id))
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<DeletedNotesListResponse>(
        QUERY_KEYS.deleted,
        (old) => {
          if (!old) return old
          return {
            ...old,
            notes: old.notes.filter((n) => n.id !== deletedId),
          }
        }
      )
    },
  })
}

export function useBulkDeleteNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (noteIds: string[]) => {
      const { data } = await api.post<{ deleted_count: number }>(
        NOTES_API.BULK_DELETE,
        { note_ids: noteIds }
      )
      return { noteIds, deletedCount: data.deleted_count }
    },
    onSuccess: ({ noteIds }) => {
      const notesData = queryClient.getQueryData<NotesListResponse>(
        QUERY_KEYS.notes
      )
      const deletedNotes =
        notesData?.notes.filter((n) => noteIds.includes(n.id)) || []

      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          notes: old.notes.filter((n) => !noteIds.includes(n.id)),
        }
      })

      queryClient.setQueryData<DeletedNotesListResponse>(
        QUERY_KEYS.deleted,
        (old) => {
          const now = new Date().toISOString()
          const deletedWithTimestamp = deletedNotes.map((n) => ({
            ...n,
            deleted_at: now,
          }))
          if (!old) return { notes: deletedWithTimestamp, folders: [] }
          return {
            ...old,
            notes: [...deletedWithTimestamp, ...old.notes],
          }
        }
      )
    },
  })
}

export function useRestoreFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<NoteFolder>(NOTES_API.RESTORE_FOLDER(id))
      return data
    },
    onSuccess: (restoredFolder) => {
      const deletedData = queryClient.getQueryData<DeletedNotesListResponse>(
        QUERY_KEYS.deleted
      )
      const restoredNotes =
        deletedData?.notes.filter((n) => n.folder_id === restoredFolder.id) || []

      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        const notesWithoutDeleted = restoredNotes.map((n) => ({
          ...n,
          deleted_at: null,
        }))
        return {
          ...old,
          folders: [...old.folders, { ...restoredFolder, deleted_at: null }],
          notes: [...old.notes, ...notesWithoutDeleted],
        }
      })

      queryClient.setQueryData<DeletedNotesListResponse>(
        QUERY_KEYS.deleted,
        (old) => {
          if (!old) return old
          return {
            ...old,
            notes: old.notes.filter((n) => n.folder_id !== restoredFolder.id),
            folders: old.folders.filter((f) => f.id !== restoredFolder.id),
          }
        }
      )
    },
  })
}

export function usePermanentDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(NOTES_API.PERMANENT_DELETE_FOLDER(id))
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<DeletedNotesListResponse>(
        QUERY_KEYS.deleted,
        (old) => {
          if (!old) return old
          return {
            ...old,
            folders: old.folders.filter((f) => f.id !== deletedId),
            notes: old.notes.filter((n) => n.folder_id !== deletedId),
          }
        }
      )
    },
  })
}

export function useBulkDeleteFolders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (folderIds: string[]) => {
      const { data } = await api.post<{ deleted_count: number }>(
        NOTES_API.BULK_DELETE_FOLDERS,
        { folder_ids: folderIds }
      )
      return { folderIds, deletedCount: data.deleted_count }
    },
    onSuccess: ({ folderIds }) => {
      const notesData = queryClient.getQueryData<NotesListResponse>(
        QUERY_KEYS.notes
      )
      const deletedFolders =
        notesData?.folders.filter((f) => folderIds.includes(f.id)) || []

      queryClient.setQueryData<NotesListResponse>(QUERY_KEYS.notes, (old) => {
        if (!old) return old
        return {
          ...old,
          folders: old.folders.filter((f) => !folderIds.includes(f.id)),
        }
      })

      queryClient.setQueryData<DeletedNotesListResponse>(
        QUERY_KEYS.deleted,
        (old) => {
          const now = new Date().toISOString()
          const deletedWithTimestamp = deletedFolders.map((f) => ({
            ...f,
            deleted_at: now,
          }))
          if (!old) return { notes: [], folders: deletedWithTimestamp }
          return {
            ...old,
            folders: [...deletedWithTimestamp, ...old.folders],
          }
        }
      )
    },
  })
}
