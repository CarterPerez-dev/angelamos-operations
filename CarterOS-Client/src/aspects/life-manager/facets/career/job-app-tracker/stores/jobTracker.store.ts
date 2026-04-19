// ===================
// © AngelaMos | 2025
// jobTracker.store.ts
// ===================

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type {
  ApplicationStatus,
  ExperienceLevel,
  JobApplication,
  JobApplicationCreateRequest,
  JobType,
  Outcome,
  Priority,
  RemoteType,
} from '../types'

type FormMode = 'create' | 'edit' | null

interface DraftFormData {
  identity_name: string
  position_title: string
  job_url: string
  salary_min: string
  salary_max: string
  location: string
  remote_type: RemoteType
  source: string
  contact_name: string
  contact_email: string
  application_status: ApplicationStatus
  job_type: JobType
  experience_level: ExperienceLevel
  priority: Priority
  date_saved: string
  date_applied: string
  followup_date: string
  notes: string
}

interface FilterState {
  search: string
  status: ApplicationStatus | null
  outcome: Outcome | null
  priority: Priority | null
  remoteType: RemoteType | null
}

type SortField =
  | 'created_at'
  | 'date_applied'
  | 'identity_name'
  | 'priority'
  | 'outcome'
type SortOrder = 'asc' | 'desc'

interface JobTrackerState {
  selectedApplicationId: string | null
  formMode: FormMode
  draftFormData: DraftFormData
  editingApplicationId: string | null

  filters: FilterState
  sortField: SortField
  sortOrder: SortOrder

  isFormOpen: boolean
  isDeleteModalOpen: boolean
  deletingApplicationId: string | null

  isLoading: boolean
  isSaving: boolean
  isDeleting: boolean
  error: string | null
}

interface JobTrackerActions {
  setSelectedApplicationId: (id: string | null) => void

  openCreateForm: () => void
  openEditForm: (application: JobApplication) => void
  closeForm: () => void

  updateDraftField: <K extends keyof DraftFormData>(
    field: K,
    value: DraftFormData[K]
  ) => void
  resetDraftForm: () => void
  populateDraftFromApplication: (application: JobApplication) => void

  getDraftAsCreateRequest: () => JobApplicationCreateRequest

  setFilters: (filters: Partial<FilterState>) => void
  clearFilters: () => void
  setSearch: (search: string) => void
  setSortField: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  toggleSortOrder: () => void

  openDeleteModal: (id: string) => void
  closeDeleteModal: () => void

  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setDeleting: (deleting: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  reset: () => void
}

type JobTrackerStore = JobTrackerState & JobTrackerActions

const emptyDraftFormData: DraftFormData = {
  identity_name: '',
  position_title: '',
  job_url: '',
  salary_min: '',
  salary_max: '',
  location: '',
  remote_type: 'unknown',
  source: '',
  contact_name: '',
  contact_email: '',
  application_status: 'saved',
  job_type: 'unknown',
  experience_level: 'unknown',
  priority: 'medium',
  date_saved: '',
  date_applied: '',
  followup_date: '',
  notes: '',
}

const initialFilters: FilterState = {
  search: '',
  status: null,
  outcome: null,
  priority: null,
  remoteType: null,
}

const initialState: JobTrackerState = {
  selectedApplicationId: null,
  formMode: null,
  draftFormData: { ...emptyDraftFormData },
  editingApplicationId: null,

  filters: { ...initialFilters },
  sortField: 'created_at',
  sortOrder: 'desc',

  isFormOpen: false,
  isDeleteModalOpen: false,
  deletingApplicationId: null,

  isLoading: false,
  isSaving: false,
  isDeleting: false,
  error: null,
}

export const useJobTrackerStore = create<JobTrackerStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setSelectedApplicationId: (id) =>
          set({ selectedApplicationId: id }, false, 'jobTracker/setSelectedId'),

        openCreateForm: () =>
          set(
            {
              formMode: 'create',
              isFormOpen: true,
              editingApplicationId: null,
            },
            false,
            'jobTracker/openCreateForm'
          ),

        openEditForm: (application) => {
          const state = get()
          state.populateDraftFromApplication(application)
          set(
            {
              formMode: 'edit',
              isFormOpen: true,
              editingApplicationId: application.id,
            },
            false,
            'jobTracker/openEditForm'
          )
        },

        closeForm: () =>
          set(
            {
              formMode: null,
              isFormOpen: false,
              editingApplicationId: null,
            },
            false,
            'jobTracker/closeForm'
          ),

        updateDraftField: (field, value) =>
          set(
            (state) => ({
              draftFormData: {
                ...state.draftFormData,
                [field]: value,
              },
            }),
            false,
            `jobTracker/updateDraft/${field}`
          ),

        resetDraftForm: () =>
          set(
            { draftFormData: { ...emptyDraftFormData } },
            false,
            'jobTracker/resetDraft'
          ),

        populateDraftFromApplication: (application) =>
          set(
            {
              draftFormData: {
                identity_name: application.identity_name,
                position_title: application.position_title,
                job_url: application.job_url ?? '',
                salary_min: application.salary_min?.toString() ?? '',
                salary_max: application.salary_max?.toString() ?? '',
                location: application.location ?? '',
                remote_type: application.remote_type,
                source: application.source ?? '',
                contact_name: application.contact_name ?? '',
                contact_email: application.contact_email ?? '',
                application_status: application.application_status,
                job_type: application.job_type,
                experience_level: application.experience_level,
                priority: application.priority,
                date_saved: application.date_saved ?? '',
                date_applied: application.date_applied ?? '',
                followup_date: application.followup_date ?? '',
                notes: application.notes ?? '',
              },
            },
            false,
            'jobTracker/populateDraft'
          ),

        getDraftAsCreateRequest: () => {
          const { draftFormData } = get()
          return {
            identity_name: draftFormData.identity_name,
            position_title: draftFormData.position_title,
            job_url: draftFormData.job_url || null,
            salary_min: draftFormData.salary_min
              ? parseInt(draftFormData.salary_min, 10)
              : null,
            salary_max: draftFormData.salary_max
              ? parseInt(draftFormData.salary_max, 10)
              : null,
            location: draftFormData.location || null,
            remote_type: draftFormData.remote_type,
            source: draftFormData.source || null,
            contact_name: draftFormData.contact_name || null,
            contact_email: draftFormData.contact_email || null,
            application_status: draftFormData.application_status,
            job_type: draftFormData.job_type,
            experience_level: draftFormData.experience_level,
            priority: draftFormData.priority,
            date_saved: draftFormData.date_saved || null,
            date_applied: draftFormData.date_applied || null,
            followup_date: draftFormData.followup_date || null,
            notes: draftFormData.notes || null,
          }
        },

        setFilters: (filters) =>
          set(
            (state) => ({
              filters: { ...state.filters, ...filters },
            }),
            false,
            'jobTracker/setFilters'
          ),

        clearFilters: () =>
          set(
            { filters: { ...initialFilters } },
            false,
            'jobTracker/clearFilters'
          ),

        setSearch: (search) =>
          set(
            (state) => ({
              filters: { ...state.filters, search },
            }),
            false,
            'jobTracker/setSearch'
          ),

        setSortField: (field) =>
          set({ sortField: field }, false, 'jobTracker/setSortField'),

        setSortOrder: (order) =>
          set({ sortOrder: order }, false, 'jobTracker/setSortOrder'),

        toggleSortOrder: () =>
          set(
            (state) => ({
              sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
            }),
            false,
            'jobTracker/toggleSortOrder'
          ),

        openDeleteModal: (id) =>
          set(
            {
              isDeleteModalOpen: true,
              deletingApplicationId: id,
            },
            false,
            'jobTracker/openDeleteModal'
          ),

        closeDeleteModal: () =>
          set(
            {
              isDeleteModalOpen: false,
              deletingApplicationId: null,
            },
            false,
            'jobTracker/closeDeleteModal'
          ),

        setLoading: (loading) =>
          set({ isLoading: loading }, false, 'jobTracker/setLoading'),

        setSaving: (saving) =>
          set({ isSaving: saving }, false, 'jobTracker/setSaving'),

        setDeleting: (deleting) =>
          set({ isDeleting: deleting }, false, 'jobTracker/setDeleting'),

        setError: (error) => set({ error }, false, 'jobTracker/setError'),

        clearError: () => set({ error: null }, false, 'jobTracker/clearError'),

        reset: () => set(initialState, false, 'jobTracker/reset'),
      }),
      {
        name: 'job-tracker-storage',
        partialize: (state) => ({
          draftFormData: state.draftFormData,
          filters: state.filters,
          sortField: state.sortField,
          sortOrder: state.sortOrder,
        }),
      }
    ),
    { name: 'JobTrackerStore' }
  )
)

export const useSelectedApplicationId = (): string | null =>
  useJobTrackerStore((s) => s.selectedApplicationId)

export const useFormMode = (): FormMode => useJobTrackerStore((s) => s.formMode)

export const useDraftFormData = (): DraftFormData =>
  useJobTrackerStore((s) => s.draftFormData)

export const useEditingApplicationId = (): string | null =>
  useJobTrackerStore((s) => s.editingApplicationId)

export const useJobTrackerFilters = (): FilterState =>
  useJobTrackerStore((s) => s.filters)

export const useJobTrackerSort = (): { field: SortField; order: SortOrder } =>
  useJobTrackerStore(
    useShallow((s) => ({ field: s.sortField, order: s.sortOrder }))
  )

export const useIsFormOpen = (): boolean =>
  useJobTrackerStore((s) => s.isFormOpen)

export const useIsDeleteModalOpen = (): boolean =>
  useJobTrackerStore((s) => s.isDeleteModalOpen)

export const useDeletingApplicationId = (): string | null =>
  useJobTrackerStore((s) => s.deletingApplicationId)

export const useIsJobTrackerLoading = (): boolean =>
  useJobTrackerStore((s) => s.isLoading)

export const useIsSaving = (): boolean => useJobTrackerStore((s) => s.isSaving)

export const useIsDeleting = (): boolean =>
  useJobTrackerStore((s) => s.isDeleting)

export const useJobTrackerError = (): string | null =>
  useJobTrackerStore((s) => s.error)
