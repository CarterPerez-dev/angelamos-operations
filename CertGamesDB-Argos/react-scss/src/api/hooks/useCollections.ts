// ===================
// AngelaMos | 2026
// useCollections.ts
// ===================

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/core/api'
import { API_ENDPOINTS, QUERY_CONFIG, QUERY_KEYS } from '@/config'
import {
  parseApiResponse,
  CollectionsListResponseSchema,
  CollectionStatsSchema,
  SchemaAnalysisSchema,
  type CollectionsListResponse,
  type CollectionStats,
  type SchemaAnalysis,
  type IndexInfo,
} from '../types'
import { z } from 'zod'

export function useCollections() {
  return useQuery({
    queryKey: QUERY_KEYS.COLLECTIONS.LIST(),
    queryFn: async (): Promise<CollectionsListResponse> => {
      const { data } = await apiClient.get(API_ENDPOINTS.COLLECTIONS.LIST)
      return parseApiResponse(CollectionsListResponseSchema, data)
    },
    staleTime: QUERY_CONFIG.STALE_TIME.COLLECTIONS,
  })
}

export function useCollectionStats(name: string) {
  return useQuery({
    queryKey: QUERY_KEYS.COLLECTIONS.BY_NAME(name),
    queryFn: async (): Promise<CollectionStats> => {
      const { data } = await apiClient.get(API_ENDPOINTS.COLLECTIONS.BY_NAME(name))
      return parseApiResponse(CollectionStatsSchema, data)
    },
    enabled: !!name,
    staleTime: QUERY_CONFIG.STALE_TIME.COLLECTIONS,
  })
}

export function useCollectionSchema(name: string, sampleSize?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.COLLECTIONS.SCHEMA(name),
    queryFn: async (): Promise<SchemaAnalysis> => {
      const params = sampleSize ? `?sample_size=${sampleSize}` : ''
      const { data } = await apiClient.get(
        `${API_ENDPOINTS.COLLECTIONS.SCHEMA(name)}${params}`
      )
      return parseApiResponse(SchemaAnalysisSchema, data)
    },
    enabled: !!name,
    staleTime: QUERY_CONFIG.STALE_TIME.COLLECTIONS,
  })
}

export function useCollectionIndexes(name: string) {
  return useQuery({
    queryKey: QUERY_KEYS.COLLECTIONS.INDEXES(name),
    queryFn: async (): Promise<IndexInfo[]> => {
      const { data } = await apiClient.get(API_ENDPOINTS.COLLECTIONS.INDEXES(name))
      return parseApiResponse(z.array(z.any()), data)
    },
    enabled: !!name,
    staleTime: QUERY_CONFIG.STALE_TIME.COLLECTIONS,
  })
}

export function useCollectionDocuments(name: string, limit?: number) {
  return useQuery({
    queryKey: [...QUERY_KEYS.COLLECTIONS.BY_NAME(name), 'documents'],
    queryFn: async () => {
      const params = limit ? `?limit=${limit}` : ''
      const { data } = await apiClient.get(
        `${API_ENDPOINTS.COLLECTIONS.DOCUMENTS(name)}${params}`
      )
      return parseApiResponse(z.any(), data)
    },
    enabled: !!name,
    staleTime: QUERY_CONFIG.STALE_TIME.COLLECTIONS,
  })
}
