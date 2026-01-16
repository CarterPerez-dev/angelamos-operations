/*
AngelaMos | 2026
collections.go
*/

package mongodb

import (
	"context"
	"fmt"
	"sort"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type CollectionsRepository struct {
	client *Client
}

func NewCollectionsRepository(client *Client) *CollectionsRepository {
	return &CollectionsRepository{client: client}
}

type CollectionInfo struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	DocumentCount int64  `json:"document_count"`
	SizeBytes    int64  `json:"size_bytes"`
	AvgDocSize   int64  `json:"avg_doc_size"`
	IndexCount   int    `json:"index_count"`
}

type CollectionStats struct {
	Name          string  `json:"name"`
	DocumentCount int64   `json:"document_count"`
	SizeBytes     int64   `json:"size_bytes"`
	AvgDocSize    int64   `json:"avg_doc_size"`
	StorageSize   int64   `json:"storage_size"`
	IndexCount    int     `json:"index_count"`
	TotalIndexSize int64  `json:"total_index_size"`
	Capped        bool    `json:"capped"`
}

type FieldSchema struct {
	Name       string   `json:"name"`
	Types      []string `json:"types"`
	Coverage   float64  `json:"coverage"`
	Count      int64    `json:"count"`
	TotalDocs  int64    `json:"total_docs"`
	SampleValues []any  `json:"sample_values,omitempty"`
}

type SchemaAnalysis struct {
	CollectionName string        `json:"collection_name"`
	TotalDocuments int64         `json:"total_documents"`
	SampleSize     int64         `json:"sample_size"`
	Fields         []FieldSchema `json:"fields"`
}

type IndexInfo struct {
	Name       string         `json:"name"`
	Keys       map[string]int `json:"keys"`
	Unique     bool           `json:"unique"`
	Sparse     bool           `json:"sparse"`
	Background bool           `json:"background"`
	SizeBytes  int64          `json:"size_bytes"`
}

type FieldStats struct {
	FieldName    string         `json:"field_name"`
	TotalDocs    int64          `json:"total_docs"`
	DocsWithField int64         `json:"docs_with_field"`
	Coverage     float64        `json:"coverage"`
	UniqueValues int64          `json:"unique_values"`
	TopValues    []ValueCount   `json:"top_values,omitempty"`
	NumericStats *NumericStats  `json:"numeric_stats,omitempty"`
}

type ValueCount struct {
	Value any   `json:"value"`
	Count int64 `json:"count"`
}

type NumericStats struct {
	Min float64 `json:"min"`
	Max float64 `json:"max"`
	Avg float64 `json:"avg"`
	Sum float64 `json:"sum"`
}

func (r *CollectionsRepository) ListCollections(ctx context.Context, dbName string) ([]CollectionInfo, error) {
	db := r.client.client.Database(dbName)

	cursor, err := db.ListCollections(ctx, bson.D{})
	if err != nil {
		return nil, fmt.Errorf("list collections: %w", err)
	}
	defer cursor.Close(ctx)

	var collections []CollectionInfo
	for cursor.Next(ctx) {
		var result bson.M
		if err := cursor.Decode(&result); err != nil {
			continue
		}

		name, _ := result["name"].(string)
		collType, _ := result["type"].(string)

		if collType == "" {
			collType = "collection"
		}

		info := CollectionInfo{
			Name: name,
			Type: collType,
		}

		count, _ := db.Collection(name).EstimatedDocumentCount(ctx)
		info.DocumentCount = count

		var stats bson.M
		if err := db.RunCommand(ctx, bson.D{{"collStats", name}}).Decode(&stats); err == nil {
			if size, ok := stats["size"].(int32); ok {
				info.SizeBytes = int64(size)
			} else if size, ok := stats["size"].(int64); ok {
				info.SizeBytes = size
			}
			if avgSize, ok := stats["avgObjSize"].(int32); ok {
				info.AvgDocSize = int64(avgSize)
			} else if avgSize, ok := stats["avgObjSize"].(int64); ok {
				info.AvgDocSize = avgSize
			} else if avgSize, ok := stats["avgObjSize"].(float64); ok {
				info.AvgDocSize = int64(avgSize)
			}
			if nindexes, ok := stats["nindexes"].(int32); ok {
				info.IndexCount = int(nindexes)
			}
		}

		collections = append(collections, info)
	}

	sort.Slice(collections, func(i, j int) bool {
		return collections[i].DocumentCount > collections[j].DocumentCount
	})

	return collections, nil
}

func (r *CollectionsRepository) GetCollectionStats(ctx context.Context, dbName, collName string) (*CollectionStats, error) {
	db := r.client.client.Database(dbName)

	var stats bson.M
	if err := db.RunCommand(ctx, bson.D{{"collStats", collName}}).Decode(&stats); err != nil {
		return nil, fmt.Errorf("get collection stats: %w", err)
	}

	result := &CollectionStats{
		Name: collName,
	}

	if count, ok := stats["count"].(int32); ok {
		result.DocumentCount = int64(count)
	} else if count, ok := stats["count"].(int64); ok {
		result.DocumentCount = count
	}

	if size, ok := stats["size"].(int32); ok {
		result.SizeBytes = int64(size)
	} else if size, ok := stats["size"].(int64); ok {
		result.SizeBytes = size
	}

	if avgSize, ok := stats["avgObjSize"].(int32); ok {
		result.AvgDocSize = int64(avgSize)
	} else if avgSize, ok := stats["avgObjSize"].(int64); ok {
		result.AvgDocSize = avgSize
	} else if avgSize, ok := stats["avgObjSize"].(float64); ok {
		result.AvgDocSize = int64(avgSize)
	}

	if storageSize, ok := stats["storageSize"].(int32); ok {
		result.StorageSize = int64(storageSize)
	} else if storageSize, ok := stats["storageSize"].(int64); ok {
		result.StorageSize = storageSize
	}

	if nindexes, ok := stats["nindexes"].(int32); ok {
		result.IndexCount = int(nindexes)
	}

	if totalIndexSize, ok := stats["totalIndexSize"].(int32); ok {
		result.TotalIndexSize = int64(totalIndexSize)
	} else if totalIndexSize, ok := stats["totalIndexSize"].(int64); ok {
		result.TotalIndexSize = totalIndexSize
	}

	if capped, ok := stats["capped"].(bool); ok {
		result.Capped = capped
	}

	return result, nil
}

func (r *CollectionsRepository) AnalyzeSchema(ctx context.Context, dbName, collName string, sampleSize int) (*SchemaAnalysis, error) {
	db := r.client.client.Database(dbName)
	coll := db.Collection(collName)

	totalDocs, err := coll.EstimatedDocumentCount(ctx)
	if err != nil {
		return nil, fmt.Errorf("count documents: %w", err)
	}

	if sampleSize <= 0 {
		sampleSize = 1000
	}
	if int64(sampleSize) > totalDocs {
		sampleSize = int(totalDocs)
	}

	pipeline := mongo.Pipeline{
		{{Key: "$sample", Value: bson.D{{Key: "size", Value: sampleSize}}}},
	}

	cursor, err := coll.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("sample documents: %w", err)
	}
	defer cursor.Close(ctx)

	fieldMap := make(map[string]*fieldInfo)
	var sampledCount int64

	for cursor.Next(ctx) {
		var doc bson.M
		if err := cursor.Decode(&doc); err != nil {
			continue
		}
		sampledCount++
		analyzeDocument("", doc, fieldMap)
	}

	var fields []FieldSchema
	for name, info := range fieldMap {
		typeList := make([]string, 0, len(info.types))
		for t := range info.types {
			typeList = append(typeList, t)
		}
		sort.Strings(typeList)

		coverage := float64(info.count) / float64(sampledCount) * 100

		samples := info.samples
		if len(samples) > 5 {
			samples = samples[:5]
		}

		fields = append(fields, FieldSchema{
			Name:         name,
			Types:        typeList,
			Coverage:     coverage,
			Count:        info.count,
			TotalDocs:    sampledCount,
			SampleValues: samples,
		})
	}

	sort.Slice(fields, func(i, j int) bool {
		return fields[i].Coverage > fields[j].Coverage
	})

	return &SchemaAnalysis{
		CollectionName: collName,
		TotalDocuments: totalDocs,
		SampleSize:     sampledCount,
		Fields:         fields,
	}, nil
}

type fieldInfo struct {
	count   int64
	types   map[string]bool
	samples []any
}

func analyzeDocument(prefix string, doc bson.M, fieldMap map[string]*fieldInfo) {
	for key, value := range doc {
		fullKey := key
		if prefix != "" {
			fullKey = prefix + "." + key
		}

		if _, exists := fieldMap[fullKey]; !exists {
			fieldMap[fullKey] = &fieldInfo{
				types:   make(map[string]bool),
				samples: make([]any, 0, 5),
			}
		}

		info := fieldMap[fullKey]
		info.count++
		info.types[getTypeName(value)] = true

		if len(info.samples) < 5 {
			info.samples = append(info.samples, value)
		}

		if nested, ok := value.(bson.M); ok {
			analyzeDocument(fullKey, nested, fieldMap)
		}
	}
}

func getTypeName(v any) string {
	switch v.(type) {
	case nil:
		return "null"
	case bool:
		return "boolean"
	case int, int32, int64:
		return "int"
	case float32, float64:
		return "double"
	case string:
		return "string"
	case bson.ObjectID:
		return "objectId"
	case bson.M, bson.D:
		return "object"
	case bson.A, []any:
		return "array"
	default:
		return fmt.Sprintf("%T", v)
	}
}

func (r *CollectionsRepository) GetIndexes(ctx context.Context, dbName, collName string) ([]IndexInfo, error) {
	db := r.client.client.Database(dbName)
	coll := db.Collection(collName)

	cursor, err := coll.Indexes().List(ctx)
	if err != nil {
		return nil, fmt.Errorf("list indexes: %w", err)
	}
	defer cursor.Close(ctx)

	var indexStats bson.M
	db.RunCommand(ctx, bson.D{{"collStats", collName}}).Decode(&indexStats)

	indexSizes := make(map[string]int64)
	if sizes, ok := indexStats["indexSizes"].(bson.M); ok {
		for name, size := range sizes {
			if s, ok := size.(int32); ok {
				indexSizes[name] = int64(s)
			} else if s, ok := size.(int64); ok {
				indexSizes[name] = s
			}
		}
	}

	var indexes []IndexInfo
	for cursor.Next(ctx) {
		var idx bson.M
		if err := cursor.Decode(&idx); err != nil {
			continue
		}

		name, _ := idx["name"].(string)
		unique, _ := idx["unique"].(bool)
		sparse, _ := idx["sparse"].(bool)
		background, _ := idx["background"].(bool)

		keys := make(map[string]int)
		if keyDoc, ok := idx["key"].(bson.M); ok {
			for k, v := range keyDoc {
				if dir, ok := v.(int32); ok {
					keys[k] = int(dir)
				} else if dir, ok := v.(int64); ok {
					keys[k] = int(dir)
				} else if dir, ok := v.(float64); ok {
					keys[k] = int(dir)
				} else if dir, ok := v.(string); ok {
					if dir == "text" {
						keys[k] = 0
					}
				}
			}
		}

		indexes = append(indexes, IndexInfo{
			Name:       name,
			Keys:       keys,
			Unique:     unique,
			Sparse:     sparse,
			Background: background,
			SizeBytes:  indexSizes[name],
		})
	}

	return indexes, nil
}

func (r *CollectionsRepository) SampleDocuments(ctx context.Context, dbName, collName string, limit int) ([]bson.M, error) {
	db := r.client.client.Database(dbName)
	coll := db.Collection(collName)

	if limit <= 0 {
		limit = 20
	}

	pipeline := mongo.Pipeline{
		{{Key: "$sample", Value: bson.D{{Key: "size", Value: limit}}}},
	}

	cursor, err := coll.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("sample documents: %w", err)
	}
	defer cursor.Close(ctx)

	var docs []bson.M
	if err := cursor.All(ctx, &docs); err != nil {
		return nil, fmt.Errorf("decode documents: %w", err)
	}

	return docs, nil
}

func (r *CollectionsRepository) GetFieldStats(ctx context.Context, dbName, collName, fieldName string) (*FieldStats, error) {
	db := r.client.client.Database(dbName)
	coll := db.Collection(collName)

	totalDocs, err := coll.EstimatedDocumentCount(ctx)
	if err != nil {
		return nil, fmt.Errorf("count documents: %w", err)
	}

	docsWithField, err := coll.CountDocuments(ctx, bson.D{{Key: fieldName, Value: bson.D{{Key: "$exists", Value: true}}}})
	if err != nil {
		return nil, fmt.Errorf("count field documents: %w", err)
	}

	coverage := float64(docsWithField) / float64(totalDocs) * 100

	result := &FieldStats{
		FieldName:     fieldName,
		TotalDocs:     totalDocs,
		DocsWithField: docsWithField,
		Coverage:      coverage,
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: fieldName, Value: bson.D{{Key: "$exists", Value: true}}}}}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$" + fieldName},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
		{{Key: "$limit", Value: 10}},
	}

	cursor, err := coll.Aggregate(ctx, pipeline)
	if err == nil {
		defer cursor.Close(ctx)
		var topValues []ValueCount
		for cursor.Next(ctx) {
			var doc bson.M
			if err := cursor.Decode(&doc); err != nil {
				continue
			}
			val := doc["_id"]
			cnt, _ := doc["count"].(int32)
			topValues = append(topValues, ValueCount{
				Value: val,
				Count: int64(cnt),
			})
		}
		result.TopValues = topValues
		result.UniqueValues = int64(len(topValues))
	}

	numPipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{
			{Key: fieldName, Value: bson.D{{Key: "$exists", Value: true}}},
			{Key: fieldName, Value: bson.D{{Key: "$type", Value: "number"}}},
		}}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: nil},
			{Key: "min", Value: bson.D{{Key: "$min", Value: "$" + fieldName}}},
			{Key: "max", Value: bson.D{{Key: "$max", Value: "$" + fieldName}}},
			{Key: "avg", Value: bson.D{{Key: "$avg", Value: "$" + fieldName}}},
			{Key: "sum", Value: bson.D{{Key: "$sum", Value: "$" + fieldName}}},
		}}},
	}

	numCursor, err := coll.Aggregate(ctx, numPipeline)
	if err == nil {
		defer numCursor.Close(ctx)
		if numCursor.Next(ctx) {
			var doc bson.M
			if err := numCursor.Decode(&doc); err == nil {
				result.NumericStats = &NumericStats{}
				if min, ok := doc["min"].(float64); ok {
					result.NumericStats.Min = min
				} else if min, ok := doc["min"].(int32); ok {
					result.NumericStats.Min = float64(min)
				} else if min, ok := doc["min"].(int64); ok {
					result.NumericStats.Min = float64(min)
				}
				if max, ok := doc["max"].(float64); ok {
					result.NumericStats.Max = max
				} else if max, ok := doc["max"].(int32); ok {
					result.NumericStats.Max = float64(max)
				} else if max, ok := doc["max"].(int64); ok {
					result.NumericStats.Max = float64(max)
				}
				if avg, ok := doc["avg"].(float64); ok {
					result.NumericStats.Avg = avg
				}
				if sum, ok := doc["sum"].(float64); ok {
					result.NumericStats.Sum = sum
				} else if sum, ok := doc["sum"].(int32); ok {
					result.NumericStats.Sum = float64(sum)
				} else if sum, ok := doc["sum"].(int64); ok {
					result.NumericStats.Sum = float64(sum)
				}
			}
		}
	}

	distinctPipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: fieldName, Value: bson.D{{Key: "$exists", Value: true}}}}}},
		{{Key: "$group", Value: bson.D{{Key: "_id", Value: "$" + fieldName}}}},
		{{Key: "$count", Value: "count"}},
	}

	distinctCursor, err := coll.Aggregate(ctx, distinctPipeline, options.Aggregate().SetAllowDiskUse(true))
	if err == nil {
		defer distinctCursor.Close(ctx)
		if distinctCursor.Next(ctx) {
			var doc bson.M
			if err := distinctCursor.Decode(&doc); err == nil {
				if cnt, ok := doc["count"].(int32); ok {
					result.UniqueValues = int64(cnt)
				} else if cnt, ok := doc["count"].(int64); ok {
					result.UniqueValues = cnt
				}
			}
		}
	}

	return result, nil
}

func (r *CollectionsRepository) CountByFieldValue(ctx context.Context, dbName, collName, fieldName string, value any) (int64, error) {
	db := r.client.client.Database(dbName)
	coll := db.Collection(collName)

	filter := bson.D{{Key: fieldName, Value: value}}
	count, err := coll.CountDocuments(ctx, filter)
	if err != nil {
		return 0, fmt.Errorf("count by field value: %w", err)
	}

	return count, nil
}

func (r *CollectionsRepository) CountByFilter(ctx context.Context, dbName, collName string, filter bson.D) (int64, error) {
	db := r.client.client.Database(dbName)
	coll := db.Collection(collName)

	count, err := coll.CountDocuments(ctx, filter)
	if err != nil {
		return 0, fmt.Errorf("count by filter: %w", err)
	}

	return count, nil
}
