// ===================
// AngelaMos | 2026
// metrics.types.ts
// ===================

import { z } from 'zod'

export const ServerMetricsSchema = z.object({
  host: z.string(),
  version: z.string(),
  uptime_seconds: z.number(),
})

export const DatabaseMetricsSchema = z.object({
  name: z.string(),
  collections: z.number(),
  documents: z.number(),
  data_size_mb: z.number(),
  storage_size_mb: z.number(),
  indexes: z.number(),
  index_size_mb: z.number(),
  total_databases: z.number(),
})

export const ConnectionStatsSchema = z.object({
  current: z.number(),
  available: z.number(),
  total_created: z.number(),
})

export const OpCountersSchema = z.object({
  insert: z.number(),
  query: z.number(),
  update: z.number(),
  delete: z.number(),
  getmore: z.number(),
  command: z.number(),
  total: z.number(),
})

export const MemoryStatsSchema = z.object({
  resident_mb: z.number(),
  virtual_mb: z.number(),
})

export const NetworkStatsSchema = z.object({
  bytes_in_mb: z.number(),
  bytes_out_mb: z.number(),
  num_requests: z.number(),
})

export const CurrentOperationSchema = z.object({
  opid: z.number(),
  type: z.string(),
  namespace: z.string(),
  collection: z.string(),
  microsecs_running: z.number(),
  millis_running: z.number(),
  client: z.string(),
})

export const DashboardMetricsSchema = z.object({
  timestamp: z.string(),
  server: ServerMetricsSchema,
  database: DatabaseMetricsSchema,
  connections: ConnectionStatsSchema,
  operations: OpCountersSchema,
  memory: MemoryStatsSchema,
  network: NetworkStatsSchema,
  active_ops: z.number(),
  current_ops: z.array(CurrentOperationSchema),
  paid_subscribers: z.number(),
})

export const SlowQuerySchema = z.object({
  timestamp: z.string(),
  op: z.string(),
  namespace: z.string(),
  millis: z.number(),
  plan_summary: z.string(),
  command: z.unknown().optional(),
  query: z.unknown().optional(),
  keys_examined: z.number(),
  docs_examined: z.number(),
  num_yields: z.number(),
  response_length: z.number(),
  client: z.string(),
  user: z.string(),
})

export const SlowQueryReportSchema = z.object({
  database: z.string(),
  profiling_level: z.number(),
  slow_ms_threshold: z.number(),
  query_count: z.number(),
  queries: z.array(SlowQuerySchema).nullable(),
})

export const IndexSuggestionSchema = z.object({
  collection: z.string(),
  suggested_index: z.array(z.string()),
  reason: z.string(),
  query_pattern: z.string(),
  occurrences: z.number(),
})

export const SlowCollectionStatsSchema = z.object({
  namespace: z.string(),
  count: z.number(),
  avg_millis: z.number(),
  max_millis: z.number(),
})

export const OperationStatsSchema = z.object({
  operation: z.string(),
  count: z.number(),
  avg_millis: z.number(),
})

export const SlowQueryAnalysisSchema = z.object({
  database: z.string(),
  total_queries: z.number(),
  analyzed_queries: z.number(),
  suggestions: z.array(IndexSuggestionSchema).nullable(),
  top_collections: z.array(SlowCollectionStatsSchema).nullable(),
  top_operations: z.array(OperationStatsSchema).nullable(),
})

export const ProfilingStatusSchema = z.object({
  database: z.string(),
  level: z.number(),
  slow_ms: z.number(),
})

export const SetProfilingRequestSchema = z.object({
  level: z.number().min(0).max(2),
  slow_ms: z.number().optional(),
})

export type ServerMetrics = z.infer<typeof ServerMetricsSchema>
export type DatabaseMetrics = z.infer<typeof DatabaseMetricsSchema>
export type ConnectionStats = z.infer<typeof ConnectionStatsSchema>
export type OpCounters = z.infer<typeof OpCountersSchema>
export type MemoryStats = z.infer<typeof MemoryStatsSchema>
export type NetworkStats = z.infer<typeof NetworkStatsSchema>
export type CurrentOperation = z.infer<typeof CurrentOperationSchema>
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>
export type SlowQuery = z.infer<typeof SlowQuerySchema>
export type SlowQueryReport = z.infer<typeof SlowQueryReportSchema>
export type IndexSuggestion = z.infer<typeof IndexSuggestionSchema>
export type SlowQueryAnalysis = z.infer<typeof SlowQueryAnalysisSchema>
export type ProfilingStatus = z.infer<typeof ProfilingStatusSchema>
export type SetProfilingRequest = z.infer<typeof SetProfilingRequestSchema>
