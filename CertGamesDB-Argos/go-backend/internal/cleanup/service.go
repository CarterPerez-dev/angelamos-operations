/*
AngelaMos | 2026
service.go
*/

package cleanup

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type Service struct {
	client         *mongo.Client
	database       string
	retentionDays  int
	logger         *slog.Logger
}

func NewService(client *mongo.Client, database string, retentionDays int, logger *slog.Logger) *Service {
	return &Service{
		client:        client,
		database:      database,
		retentionDays: retentionDays,
		logger:        logger,
	}
}

type CleanupResult struct {
	Collection    string
	DeletedCount  int64
	Duration      time.Duration
	Error         error
}

func (s *Service) CleanOldDocuments(ctx context.Context) ([]CleanupResult, error) {
	s.logger.Info("starting cleanup task", "retention_days", s.retentionDays)

	collectionsWithRetention := []string{
		"perfSamples",
		"auditLogs",
		"admin_request_logs",
		"uniqueUserRequests",
		"watchList",
		"globalRateLimits",
		"scanAttempts",
	}

	legacyCollections := []string{
		"honeypot_interactions",
	}

	var results []CleanupResult

	cutoffDate := time.Now().AddDate(0, 0, -s.retentionDays)

	for _, collName := range collectionsWithRetention {
		result := s.cleanCollectionByDate(ctx, collName, cutoffDate)
		results = append(results, result)
	}

	for _, collName := range legacyCollections {
		result := s.dropAllDocuments(ctx, collName)
		results = append(results, result)
	}

	s.logCleanupResults(results)

	return results, nil
}

func (s *Service) cleanCollectionByDate(ctx context.Context, collName string, cutoffDate time.Time) CleanupResult {
	start := time.Now()
	result := CleanupResult{
		Collection: collName,
	}

	coll := s.client.Database(s.database).Collection(collName)

	filter := bson.D{
		{Key: "timestamp", Value: bson.D{{Key: "$lt", Value: cutoffDate}}},
	}

	deleteResult, err := coll.DeleteMany(ctx, filter)
	if err != nil {
		result.Error = fmt.Errorf("delete old documents: %w", err)
		result.Duration = time.Since(start)
		return result
	}

	result.DeletedCount = deleteResult.DeletedCount
	result.Duration = time.Since(start)

	return result
}

func (s *Service) dropAllDocuments(ctx context.Context, collName string) CleanupResult {
	start := time.Now()
	result := CleanupResult{
		Collection: collName,
	}

	coll := s.client.Database(s.database).Collection(collName)

	deleteResult, err := coll.DeleteMany(ctx, bson.D{})
	if err != nil {
		result.Error = fmt.Errorf("drop all documents: %w", err)
		result.Duration = time.Since(start)
		return result
	}

	result.DeletedCount = deleteResult.DeletedCount
	result.Duration = time.Since(start)

	return result
}

func (s *Service) logCleanupResults(results []CleanupResult) {
	totalDeleted := int64(0)
	successCount := 0
	errorCount := 0

	for _, result := range results {
		if result.Error != nil {
			s.logger.Error("cleanup failed",
				"collection", result.Collection,
				"error", result.Error,
				"duration", result.Duration,
			)
			errorCount++
		} else {
			s.logger.Info("cleanup completed",
				"collection", result.Collection,
				"deleted_count", result.DeletedCount,
				"duration", result.Duration,
			)
			totalDeleted += result.DeletedCount
			successCount++
		}
	}

	s.logger.Info("cleanup task finished",
		"total_deleted", totalDeleted,
		"successful_collections", successCount,
		"failed_collections", errorCount,
	)
}
