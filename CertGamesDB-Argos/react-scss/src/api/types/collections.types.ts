// ===================
// AngelaMos | 2026
// collections.types.ts
// ===================

import { z } from 'zod'

export const CollectionInfoSchema = z.object({
  name: z.string(),
  type: z.string(),
  document_count: z.number(),
  size_bytes: z.number(),
  avg_doc_size: z.number(),
  index_count: z.number(),
})

export const CollectionsListResponseSchema = z.object({
  database: z.string(),
  count: z.number(),
  collections: z.array(CollectionInfoSchema),
})

export const CollectionStatsSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  count: z.number(),
  size: z.number(),
  avg_obj_size: z.number(),
  storage_size: z.number(),
  total_index_size: z.number(),
  index_sizes: z.record(z.number()),
  capped: z.boolean(),
})

export const FieldInfoSchema = z.object({
  name: z.string(),
  types: z.array(z.string()),
  coverage: z.number(),
  sample_values: z.array(z.unknown()),
})

export const SchemaAnalysisSchema = z.object({
  collection: z.string(),
  sample_size: z.number(),
  total_documents: z.number(),
  fields: z.array(FieldInfoSchema),
})

export const IndexInfoSchema = z.object({
  name: z.string(),
  keys: z.record(z.number()),
  unique: z.boolean(),
  sparse: z.boolean(),
  background: z.boolean(),
  expire_after_seconds: z.number().optional(),
  partial_filter_expression: z.record(z.unknown()).optional(),
  size_bytes: z.number(),
})

export const FieldStatsSchema = z.object({
  collection: z.string(),
  field: z.string(),
  total_documents: z.number(),
  documents_with_field: z.number(),
  coverage_percent: z.number(),
  types: z.record(z.number()),
  sample_values: z.array(z.unknown()),
})

export const CountResponseSchema = z.object({
  collection: z.string(),
  field: z.string(),
  value: z.unknown(),
  count: z.number(),
})

export type CollectionInfo = z.infer<typeof CollectionInfoSchema>
export type CollectionsListResponse = z.infer<typeof CollectionsListResponseSchema>
export type CollectionStats = z.infer<typeof CollectionStatsSchema>
export type FieldInfo = z.infer<typeof FieldInfoSchema>
export type SchemaAnalysis = z.infer<typeof SchemaAnalysisSchema>
export type IndexInfo = z.infer<typeof IndexInfoSchema>
export type FieldStats = z.infer<typeof FieldStatsSchema>
export type CountResponse = z.infer<typeof CountResponseSchema>
