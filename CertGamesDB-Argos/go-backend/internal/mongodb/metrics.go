/*
AngelaMos | 2026
metrics.go
*/

package mongodb

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type MetricsRepository struct {
	client *Client
}

func NewMetricsRepository(client *Client) *MetricsRepository {
	return &MetricsRepository{client: client}
}

type ServerStatus struct {
	Host        string    `bson:"host"`
	Version     string    `bson:"version"`
	Uptime      int64     `bson:"uptime"`
	LocalTime   time.Time `bson:"localTime"`
	Connections struct {
		Current      int `bson:"current"`
		Available    int `bson:"available"`
		TotalCreated int `bson:"totalCreated"`
	} `bson:"connections"`
	Opcounters struct {
		Insert  int64 `bson:"insert"`
		Query   int64 `bson:"query"`
		Update  int64 `bson:"update"`
		Delete  int64 `bson:"delete"`
		Getmore int64 `bson:"getmore"`
		Command int64 `bson:"command"`
	} `bson:"opcounters"`
	Mem struct {
		Resident int `bson:"resident"`
		Virtual  int `bson:"virtual"`
	} `bson:"mem"`
	Network struct {
		BytesIn     int64 `bson:"bytesIn"`
		BytesOut    int64 `bson:"bytesOut"`
		NumRequests int64 `bson:"numRequests"`
	} `bson:"network"`
}

type DatabaseStats struct {
	DB          string  `bson:"db"`
	Collections int     `bson:"collections"`
	Views       int     `bson:"views"`
	Objects     int64   `bson:"objects"`
	DataSize    float64 `bson:"dataSize"`
	StorageSize float64 `bson:"storageSize"`
	Indexes     int     `bson:"indexes"`
	IndexSize   float64 `bson:"indexSize"`
}

type CurrentOp struct {
	Inprog []Operation `bson:"inprog"`
}

type Operation struct {
	OpID            int       `bson:"opid"`
	Active          bool      `bson:"active"`
	Op              string    `bson:"op"`
	Namespace       string    `bson:"ns"`
	SecsRunning     int       `bson:"secs_running"`
	MicrosecsRunning int64    `bson:"microsecs_running"`
	Command         bson.Raw  `bson:"command"`
	Client          string    `bson:"client"`
}

func (r *MetricsRepository) GetServerStatus(ctx context.Context) (*ServerStatus, error) {
	var result ServerStatus
	err := r.client.Database("admin").RunCommand(ctx, bson.D{{"serverStatus", 1}}).Decode(&result)
	if err != nil {
		return nil, fmt.Errorf("serverStatus command: %w", err)
	}
	return &result, nil
}

func (r *MetricsRepository) GetDatabaseStats(ctx context.Context, dbName string) (*DatabaseStats, error) {
	var result DatabaseStats
	err := r.client.Database(dbName).RunCommand(ctx, bson.D{{"dbStats", 1}}).Decode(&result)
	if err != nil {
		return nil, fmt.Errorf("dbStats command: %w", err)
	}
	return &result, nil
}

func (r *MetricsRepository) GetCurrentOps(ctx context.Context) ([]Operation, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$currentOp", Value: bson.D{
			{Key: "allUsers", Value: true},
			{Key: "idleConnections", Value: false},
		}}},
		{{Key: "$match", Value: bson.D{
			{Key: "active", Value: true},
		}}},
	}

	cursor, err := r.client.Database("admin").Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("currentOp aggregate: %w", err)
	}
	defer cursor.Close(ctx)

	var ops []Operation
	if err := cursor.All(ctx, &ops); err != nil {
		return nil, fmt.Errorf("decode currentOp: %w", err)
	}

	return ops, nil
}

func (r *MetricsRepository) ListDatabases(ctx context.Context) ([]string, error) {
	result, err := r.client.Client().ListDatabaseNames(ctx, bson.D{})
	if err != nil {
		return nil, fmt.Errorf("list databases: %w", err)
	}
	return result, nil
}

func (r *MetricsRepository) GetCollectionCount(ctx context.Context, dbName string) (int, error) {
	collections, err := r.client.Database(dbName).ListCollectionNames(ctx, bson.D{})
	if err != nil {
		return 0, fmt.Errorf("list collections: %w", err)
	}
	return len(collections), nil
}

type SlowQuery struct {
	Timestamp    time.Time `bson:"ts" json:"timestamp"`
	Op           string    `bson:"op" json:"op"`
	Namespace    string    `bson:"ns" json:"namespace"`
	MillisRuntime int      `bson:"millis" json:"millis"`
	PlanSummary  string    `bson:"planSummary" json:"plan_summary"`
	Command      bson.Raw  `bson:"command" json:"command,omitempty"`
	Query        bson.Raw  `bson:"query" json:"query,omitempty"`
	KeysExamined int64     `bson:"keysExamined" json:"keys_examined"`
	DocsExamined int64     `bson:"docsExamined" json:"docs_examined"`
	NumYields    int       `bson:"numYield" json:"num_yields"`
	ResponseLen  int       `bson:"responseLength" json:"response_length"`
	Client       string    `bson:"client" json:"client"`
	User         string    `bson:"user" json:"user"`
}

type IndexSuggestion struct {
	Collection     string   `json:"collection"`
	SuggestedIndex []string `json:"suggested_index"`
	Reason         string   `json:"reason"`
	QueryPattern   string   `json:"query_pattern"`
	Occurrences    int      `json:"occurrences"`
}

func (r *MetricsRepository) GetSlowQueries(ctx context.Context, dbName string, minMillis int, limit int) ([]SlowQuery, error) {
	if minMillis <= 0 {
		minMillis = 100
	}
	if limit <= 0 {
		limit = 50
	}

	coll := r.client.Database(dbName).Collection("system.profile")

	filter := bson.D{
		{Key: "millis", Value: bson.D{{Key: "$gte", Value: minMillis}}},
	}

	cursor, err := coll.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("query system.profile: %w", err)
	}
	defer cursor.Close(ctx)

	var queries []SlowQuery
	count := 0
	for cursor.Next(ctx) && count < limit {
		var q SlowQuery
		if err := cursor.Decode(&q); err != nil {
			continue
		}
		queries = append(queries, q)
		count++
	}

	return queries, nil
}

func (r *MetricsRepository) GetProfilingStatus(ctx context.Context, dbName string) (int, int, error) {
	var result struct {
		Was      int `bson:"was"`
		SlowMs   int `bson:"slowms"`
	}

	err := r.client.Database(dbName).RunCommand(ctx, bson.D{{"profile", -1}}).Decode(&result)
	if err != nil {
		return 0, 0, fmt.Errorf("get profiling status: %w", err)
	}

	return result.Was, result.SlowMs, nil
}

func (r *MetricsRepository) SetProfilingLevel(ctx context.Context, dbName string, level int, slowMs int) error {
	cmd := bson.D{
		{Key: "profile", Value: level},
	}
	if slowMs > 0 {
		cmd = append(cmd, bson.E{Key: "slowms", Value: slowMs})
	}

	var result bson.M
	err := r.client.Database(dbName).RunCommand(ctx, cmd).Decode(&result)
	if err != nil {
		return fmt.Errorf("set profiling level: %w", err)
	}

	return nil
}

func (r *MetricsRepository) GetTruePaidSubscribers(ctx context.Context, dbName string) (int64, error) {
	excludedEmails := []string{
		"daleneumeister@gmail.com",
		"testflight@gmail.com",
		"admin@gmail.com",
		"brandonbaldwin1987@gmail.com",
		"carterperez4433@gmail.com",
	}

	filter := bson.D{
		{Key: "subscriptionStatus", Value: "active"},
		{Key: "stripeSubscriptionId", Value: bson.D{{Key: "$regex", Value: "^sub_"}}},
		{Key: "stripeCustomerId", Value: bson.D{{Key: "$regex", Value: "^cus_"}}},
		{Key: "email", Value: bson.D{{Key: "$nin", Value: excludedEmails}}},
		{Key: "tags", Value: bson.D{{Key: "$ne", Value: "PROMO"}}},
	}

	count, err := r.client.Database(dbName).Collection("mainusers").CountDocuments(ctx, filter)
	if err != nil {
		return 0, fmt.Errorf("count paid subscribers: %w", err)
	}
	return count, nil
}
