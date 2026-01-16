/*
AngelaMos | 2026
collections.go
*/

package handler

import (
	"context"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/v2/bson"

	"github.com/carterperez-dev/templates/go-backend/internal/core"
	"github.com/carterperez-dev/templates/go-backend/internal/mongodb"
)

type collectionsRepository interface {
	ListCollections(ctx context.Context, dbName string) ([]mongodb.CollectionInfo, error)
	GetCollectionStats(ctx context.Context, dbName, collName string) (*mongodb.CollectionStats, error)
	AnalyzeSchema(ctx context.Context, dbName, collName string, sampleSize int) (*mongodb.SchemaAnalysis, error)
	GetIndexes(ctx context.Context, dbName, collName string) ([]mongodb.IndexInfo, error)
	SampleDocuments(ctx context.Context, dbName, collName string, limit int) ([]bson.M, error)
	GetFieldStats(ctx context.Context, dbName, collName, fieldName string) (*mongodb.FieldStats, error)
	CountByFieldValue(ctx context.Context, dbName, collName, fieldName string, value any) (int64, error)
}

type CollectionsHandler struct {
	repo     collectionsRepository
	database string
}

func NewCollectionsHandler(repo collectionsRepository, database string) *CollectionsHandler {
	return &CollectionsHandler{
		repo:     repo,
		database: database,
	}
}

func (h *CollectionsHandler) RegisterRoutes(r chi.Router) {
	r.Route("/api/collections", func(r chi.Router) {
		r.Get("/", h.List)
		r.Get("/{name}", h.GetStats)
		r.Get("/{name}/schema", h.GetSchema)
		r.Get("/{name}/indexes", h.GetIndexes)
		r.Get("/{name}/documents", h.SampleDocuments)
		r.Get("/{name}/fields/{field}", h.GetFieldStats)
		r.Get("/{name}/count", h.CountByField)
	})
}

type CollectionsListResponse struct {
	Database    string                    `json:"database"`
	Count       int                       `json:"count"`
	Collections []mongodb.CollectionInfo  `json:"collections"`
}

func (h *CollectionsHandler) List(w http.ResponseWriter, r *http.Request) {
	dbName := r.URL.Query().Get("database")
	if dbName == "" {
		dbName = h.database
	}

	collections, err := h.repo.ListCollections(r.Context(), dbName)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	response := CollectionsListResponse{
		Database:    dbName,
		Count:       len(collections),
		Collections: collections,
	}

	core.OK(w, response)
}

func (h *CollectionsHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	dbName := r.URL.Query().Get("database")
	if dbName == "" {
		dbName = h.database
	}

	stats, err := h.repo.GetCollectionStats(r.Context(), dbName, name)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.OK(w, stats)
}

func (h *CollectionsHandler) GetSchema(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	dbName := r.URL.Query().Get("database")
	if dbName == "" {
		dbName = h.database
	}

	sampleSize := 1000
	if s := r.URL.Query().Get("sample_size"); s != "" {
		if parsed, err := strconv.Atoi(s); err == nil && parsed > 0 && parsed <= 10000 {
			sampleSize = parsed
		}
	}

	schema, err := h.repo.AnalyzeSchema(r.Context(), dbName, name, sampleSize)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.OK(w, schema)
}

func (h *CollectionsHandler) GetIndexes(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	dbName := r.URL.Query().Get("database")
	if dbName == "" {
		dbName = h.database
	}

	indexes, err := h.repo.GetIndexes(r.Context(), dbName, name)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.OK(w, indexes)
}

type DocumentsResponse struct {
	Collection string   `json:"collection"`
	Count      int      `json:"count"`
	Documents  []bson.M `json:"documents"`
}

func (h *CollectionsHandler) SampleDocuments(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	dbName := r.URL.Query().Get("database")
	if dbName == "" {
		dbName = h.database
	}

	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	docs, err := h.repo.SampleDocuments(r.Context(), dbName, name, limit)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	response := DocumentsResponse{
		Collection: name,
		Count:      len(docs),
		Documents:  docs,
	}

	core.OK(w, response)
}

func (h *CollectionsHandler) GetFieldStats(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	field := chi.URLParam(r, "field")
	dbName := r.URL.Query().Get("database")
	if dbName == "" {
		dbName = h.database
	}

	stats, err := h.repo.GetFieldStats(r.Context(), dbName, name, field)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.OK(w, stats)
}

type CountResponse struct {
	Collection string `json:"collection"`
	Field      string `json:"field"`
	Value      any    `json:"value"`
	Count      int64  `json:"count"`
}

func (h *CollectionsHandler) CountByField(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	dbName := r.URL.Query().Get("database")
	if dbName == "" {
		dbName = h.database
	}

	field := r.URL.Query().Get("field")
	if field == "" {
		core.BadRequest(w, "field query parameter is required")
		return
	}

	value := r.URL.Query().Get("value")
	if value == "" {
		core.BadRequest(w, "value query parameter is required")
		return
	}

	var queryValue any = value

	if v, err := strconv.ParseInt(value, 10, 64); err == nil {
		queryValue = v
	} else if v, err := strconv.ParseFloat(value, 64); err == nil {
		queryValue = v
	} else if value == "true" {
		queryValue = true
	} else if value == "false" {
		queryValue = false
	} else if value == "null" {
		queryValue = nil
	}

	count, err := h.repo.CountByFieldValue(r.Context(), dbName, name, field, queryValue)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	response := CountResponse{
		Collection: name,
		Field:      field,
		Value:      queryValue,
		Count:      count,
	}

	core.OK(w, response)
}
