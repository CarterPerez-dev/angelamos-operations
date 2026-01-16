/*
AngelaMos | 2026
service.go
*/

package metrics

import (
	"context"
	"fmt"
	"time"

	"github.com/carterperez-dev/templates/go-backend/internal/mongodb"
)

type metricsRepository interface {
	GetServerStatus(ctx context.Context) (*mongodb.ServerStatus, error)
	GetDatabaseStats(ctx context.Context, dbName string) (*mongodb.DatabaseStats, error)
	GetCurrentOps(ctx context.Context) ([]mongodb.Operation, error)
	ListDatabases(ctx context.Context) ([]string, error)
	GetCollectionCount(ctx context.Context, dbName string) (int, error)
	GetTruePaidSubscribers(ctx context.Context, dbName string) (int64, error)
	GetSlowQueries(ctx context.Context, dbName string, minMillis int, limit int) ([]mongodb.SlowQuery, error)
	GetProfilingStatus(ctx context.Context, dbName string) (int, int, error)
	SetProfilingLevel(ctx context.Context, dbName string, level int, slowMs int) error
}

type Service struct {
	repo     metricsRepository
	database string
}

func NewService(repo metricsRepository, database string) *Service {
	return &Service{
		repo:     repo,
		database: database,
	}
}

type DashboardMetrics struct {
	Timestamp       time.Time          `json:"timestamp"`
	Server          ServerMetrics      `json:"server"`
	Database        DatabaseMetrics    `json:"database"`
	Connections     ConnectionStats    `json:"connections"`
	Operations      OpCounters         `json:"operations"`
	Memory          MemoryStats        `json:"memory"`
	Network         NetworkStats       `json:"network"`
	ActiveOps       int                `json:"active_ops"`
	CurrentOps      []CurrentOperation `json:"current_ops"`
	PaidSubscribers int64              `json:"paid_subscribers"`
}

type CurrentOperation struct {
	OpID             int     `json:"opid"`
	Type             string  `json:"type"`
	Namespace        string  `json:"namespace"`
	Collection       string  `json:"collection"`
	MicrosecsRunning int64   `json:"microsecs_running"`
	MillisRunning    float64 `json:"millis_running"`
	Client           string  `json:"client"`
}

type ServerMetrics struct {
	Host      string `json:"host"`
	Version   string `json:"version"`
	UptimeSec int64  `json:"uptime_seconds"`
}

type DatabaseMetrics struct {
	Name            string  `json:"name"`
	Collections     int     `json:"collections"`
	Documents       int64   `json:"documents"`
	DataSizeMB      float64 `json:"data_size_mb"`
	StorageSizeMB   float64 `json:"storage_size_mb"`
	Indexes         int     `json:"indexes"`
	IndexSizeMB     float64 `json:"index_size_mb"`
	TotalDatabases  int     `json:"total_databases"`
}

type ConnectionStats struct {
	Current      int `json:"current"`
	Available    int `json:"available"`
	TotalCreated int `json:"total_created"`
}

type OpCounters struct {
	Insert  int64 `json:"insert"`
	Query   int64 `json:"query"`
	Update  int64 `json:"update"`
	Delete  int64 `json:"delete"`
	Getmore int64 `json:"getmore"`
	Command int64 `json:"command"`
	Total   int64 `json:"total"`
}

type MemoryStats struct {
	ResidentMB int `json:"resident_mb"`
	VirtualMB  int `json:"virtual_mb"`
}

type NetworkStats struct {
	BytesInMB   float64 `json:"bytes_in_mb"`
	BytesOutMB  float64 `json:"bytes_out_mb"`
	NumRequests int64   `json:"num_requests"`
}

func (s *Service) GetDashboardMetrics(ctx context.Context) (*DashboardMetrics, error) {
	serverStatus, err := s.repo.GetServerStatus(ctx)
	if err != nil {
		return nil, fmt.Errorf("get server status: %w", err)
	}

	dbStats, err := s.repo.GetDatabaseStats(ctx, s.database)
	if err != nil {
		return nil, fmt.Errorf("get database stats: %w", err)
	}

	databases, err := s.repo.ListDatabases(ctx)
	if err != nil {
		return nil, fmt.Errorf("list databases: %w", err)
	}

	activeOps, err := s.repo.GetCurrentOps(ctx)
	if err != nil {
		return nil, fmt.Errorf("get current ops: %w", err)
	}

	paidSubs, err := s.repo.GetTruePaidSubscribers(ctx, s.database)
	if err != nil {
		return nil, fmt.Errorf("get paid subscribers: %w", err)
	}

	totalOps := serverStatus.Opcounters.Insert +
		serverStatus.Opcounters.Query +
		serverStatus.Opcounters.Update +
		serverStatus.Opcounters.Delete +
		serverStatus.Opcounters.Getmore +
		serverStatus.Opcounters.Command

	currentOps := make([]CurrentOperation, 0, len(activeOps))
	for _, op := range activeOps {
		collection := extractCollection(op.Namespace)
		currentOps = append(currentOps, CurrentOperation{
			OpID:             op.OpID,
			Type:             op.Op,
			Namespace:        op.Namespace,
			Collection:       collection,
			MicrosecsRunning: op.MicrosecsRunning,
			MillisRunning:    float64(op.MicrosecsRunning) / 1000.0,
			Client:           op.Client,
		})
	}

	return &DashboardMetrics{
		Timestamp: time.Now(),
		Server: ServerMetrics{
			Host:      serverStatus.Host,
			Version:   serverStatus.Version,
			UptimeSec: serverStatus.Uptime,
		},
		Database: DatabaseMetrics{
			Name:           s.database,
			Collections:    dbStats.Collections,
			Documents:      dbStats.Objects,
			DataSizeMB:     bytesToMB(dbStats.DataSize),
			StorageSizeMB:  bytesToMB(dbStats.StorageSize),
			Indexes:        dbStats.Indexes,
			IndexSizeMB:    bytesToMB(dbStats.IndexSize),
			TotalDatabases: len(databases),
		},
		Connections: ConnectionStats{
			Current:      serverStatus.Connections.Current,
			Available:    serverStatus.Connections.Available,
			TotalCreated: serverStatus.Connections.TotalCreated,
		},
		Operations: OpCounters{
			Insert:  serverStatus.Opcounters.Insert,
			Query:   serverStatus.Opcounters.Query,
			Update:  serverStatus.Opcounters.Update,
			Delete:  serverStatus.Opcounters.Delete,
			Getmore: serverStatus.Opcounters.Getmore,
			Command: serverStatus.Opcounters.Command,
			Total:   totalOps,
		},
		Memory: MemoryStats{
			ResidentMB: serverStatus.Mem.Resident,
			VirtualMB:  serverStatus.Mem.Virtual,
		},
		Network: NetworkStats{
			BytesInMB:   bytesToMB(float64(serverStatus.Network.BytesIn)),
			BytesOutMB:  bytesToMB(float64(serverStatus.Network.BytesOut)),
			NumRequests: serverStatus.Network.NumRequests,
		},
		ActiveOps:       len(activeOps),
		CurrentOps:      currentOps,
		PaidSubscribers: paidSubs,
	}, nil
}

func bytesToMB(bytes float64) float64 {
	return bytes / (1024 * 1024)
}

func extractCollection(namespace string) string {
	if namespace == "" {
		return ""
	}
	for i := 0; i < len(namespace); i++ {
		if namespace[i] == '.' {
			if i+1 < len(namespace) {
				return namespace[i+1:]
			}
			return ""
		}
	}
	return namespace
}

type SlowQueryReport struct {
	Database       string              `json:"database"`
	ProfilingLevel int                 `json:"profiling_level"`
	SlowMsThreshold int               `json:"slow_ms_threshold"`
	QueryCount     int                 `json:"query_count"`
	Queries        []mongodb.SlowQuery `json:"queries"`
}

type ProfilingStatus struct {
	Database string `json:"database"`
	Level    int    `json:"level"`
	SlowMs   int    `json:"slow_ms"`
}

type IndexSuggestion struct {
	Collection     string   `json:"collection"`
	SuggestedIndex []string `json:"suggested_index"`
	Reason         string   `json:"reason"`
	QueryPattern   string   `json:"query_pattern"`
	Occurrences    int      `json:"occurrences"`
}

type SlowQueryAnalysis struct {
	Database         string            `json:"database"`
	TotalQueries     int               `json:"total_queries"`
	AnalyzedQueries  int               `json:"analyzed_queries"`
	Suggestions      []IndexSuggestion `json:"suggestions"`
	TopCollections   []CollectionStats `json:"top_collections"`
	TopOperations    []OperationStats  `json:"top_operations"`
}

type CollectionStats struct {
	Namespace    string  `json:"namespace"`
	Count        int     `json:"count"`
	AvgMillis    float64 `json:"avg_millis"`
	MaxMillis    int     `json:"max_millis"`
}

type OperationStats struct {
	Operation string `json:"operation"`
	Count     int    `json:"count"`
	AvgMillis float64 `json:"avg_millis"`
}

func (s *Service) GetSlowQueries(ctx context.Context, minMillis, limit int) (*SlowQueryReport, error) {
	level, slowMs, err := s.repo.GetProfilingStatus(ctx, s.database)
	if err != nil {
		return nil, fmt.Errorf("get profiling status: %w", err)
	}

	queries, err := s.repo.GetSlowQueries(ctx, s.database, minMillis, limit)
	if err != nil {
		return nil, fmt.Errorf("get slow queries: %w", err)
	}

	return &SlowQueryReport{
		Database:        s.database,
		ProfilingLevel:  level,
		SlowMsThreshold: slowMs,
		QueryCount:      len(queries),
		Queries:         queries,
	}, nil
}

func (s *Service) GetProfilingStatus(ctx context.Context) (*ProfilingStatus, error) {
	level, slowMs, err := s.repo.GetProfilingStatus(ctx, s.database)
	if err != nil {
		return nil, fmt.Errorf("get profiling status: %w", err)
	}

	return &ProfilingStatus{
		Database: s.database,
		Level:    level,
		SlowMs:   slowMs,
	}, nil
}

func (s *Service) SetProfilingLevel(ctx context.Context, level, slowMs int) error {
	if level < 0 || level > 2 {
		return fmt.Errorf("invalid profiling level: must be 0, 1, or 2")
	}

	return s.repo.SetProfilingLevel(ctx, s.database, level, slowMs)
}

func (s *Service) AnalyzeSlowQueries(ctx context.Context, minMillis, limit int) (*SlowQueryAnalysis, error) {
	queries, err := s.repo.GetSlowQueries(ctx, s.database, minMillis, limit)
	if err != nil {
		return nil, fmt.Errorf("get slow queries: %w", err)
	}

	collectionMap := make(map[string]*collectionAggregator)
	operationMap := make(map[string]*operationAggregator)
	suggestionMap := make(map[string]*IndexSuggestion)

	for _, q := range queries {
		if agg, ok := collectionMap[q.Namespace]; ok {
			agg.count++
			agg.totalMillis += q.MillisRuntime
			if q.MillisRuntime > agg.maxMillis {
				agg.maxMillis = q.MillisRuntime
			}
		} else {
			collectionMap[q.Namespace] = &collectionAggregator{
				namespace:   q.Namespace,
				count:       1,
				totalMillis: q.MillisRuntime,
				maxMillis:   q.MillisRuntime,
			}
		}

		if agg, ok := operationMap[q.Op]; ok {
			agg.count++
			agg.totalMillis += q.MillisRuntime
		} else {
			operationMap[q.Op] = &operationAggregator{
				operation:   q.Op,
				count:       1,
				totalMillis: q.MillisRuntime,
			}
		}

		if q.PlanSummary == "COLLSCAN" && q.DocsExamined > 100 {
			key := q.Namespace + ":COLLSCAN"
			if sug, ok := suggestionMap[key]; ok {
				sug.Occurrences++
			} else {
				suggestionMap[key] = &IndexSuggestion{
					Collection:     q.Namespace,
					SuggestedIndex: []string{"_id"},
					Reason:         "Collection scan detected with high document examination",
					QueryPattern:   "COLLSCAN",
					Occurrences:    1,
				}
			}
		}

		if q.KeysExamined > 0 && q.DocsExamined > q.KeysExamined*10 {
			key := q.Namespace + ":INEFFICIENT_INDEX"
			if sug, ok := suggestionMap[key]; ok {
				sug.Occurrences++
			} else {
				suggestionMap[key] = &IndexSuggestion{
					Collection:     q.Namespace,
					SuggestedIndex: []string{"examine query filter fields"},
					Reason:         fmt.Sprintf("Inefficient index usage: %d docs examined vs %d keys", q.DocsExamined, q.KeysExamined),
					QueryPattern:   q.PlanSummary,
					Occurrences:    1,
				}
			}
		}
	}

	var topCollections []CollectionStats
	for _, agg := range collectionMap {
		topCollections = append(topCollections, CollectionStats{
			Namespace: agg.namespace,
			Count:     agg.count,
			AvgMillis: float64(agg.totalMillis) / float64(agg.count),
			MaxMillis: agg.maxMillis,
		})
	}

	var topOperations []OperationStats
	for _, agg := range operationMap {
		topOperations = append(topOperations, OperationStats{
			Operation: agg.operation,
			Count:     agg.count,
			AvgMillis: float64(agg.totalMillis) / float64(agg.count),
		})
	}

	var suggestions []IndexSuggestion
	for _, sug := range suggestionMap {
		suggestions = append(suggestions, *sug)
	}

	return &SlowQueryAnalysis{
		Database:        s.database,
		TotalQueries:    len(queries),
		AnalyzedQueries: len(queries),
		Suggestions:     suggestions,
		TopCollections:  topCollections,
		TopOperations:   topOperations,
	}, nil
}

type collectionAggregator struct {
	namespace   string
	count       int
	totalMillis int
	maxMillis   int
}

type operationAggregator struct {
	operation   string
	count       int
	totalMillis int
}
