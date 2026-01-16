/*
AngelaMos | 2026
backups.go
*/

package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/carterperez-dev/templates/go-backend/internal/core"
	"github.com/carterperez-dev/templates/go-backend/internal/sqlite"
)

type backupService interface {
	TriggerBackup(ctx context.Context, dbName, triggeredBy string) (*sqlite.Backup, error)
	RestoreBackup(ctx context.Context, backupID string) error
	ListBackups(ctx context.Context, limit int) ([]*sqlite.Backup, error)
	GetBackup(ctx context.Context, id string) (*sqlite.Backup, error)
	DeleteBackup(ctx context.Context, id string) error
}

type BackupsHandler struct {
	service  backupService
	database string
}

func NewBackupsHandler(service backupService, database string) *BackupsHandler {
	return &BackupsHandler{
		service:  service,
		database: database,
	}
}

func (h *BackupsHandler) RegisterRoutes(r chi.Router) {
	r.Route("/api/backups", func(r chi.Router) {
		r.Get("/", h.List)
		r.Post("/", h.Create)
		r.Get("/{id}", h.Get)
		r.Delete("/{id}", h.Delete)
		r.Post("/{id}/restore", h.Restore)
	})
}

type BackupResponse struct {
	ID           string     `json:"id"`
	DatabaseName string     `json:"database_name"`
	FilePath     string     `json:"file_path"`
	SizeBytes    int64      `json:"size_bytes"`
	SizeMB       float64    `json:"size_mb"`
	StartedAt    time.Time  `json:"started_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	Status       string     `json:"status"`
	ErrorMessage string     `json:"error_message,omitempty"`
	TriggeredBy  string     `json:"triggered_by"`
}

func toBackupResponse(b *sqlite.Backup) *BackupResponse {
	resp := &BackupResponse{
		ID:           b.ID,
		DatabaseName: b.DatabaseName,
		FilePath:     b.FilePath,
		SizeBytes:    b.SizeBytes,
		SizeMB:       float64(b.SizeBytes) / (1024 * 1024),
		StartedAt:    b.StartedAt,
		Status:       b.Status,
		TriggeredBy:  b.TriggeredBy,
	}
	if b.CompletedAt.Valid {
		resp.CompletedAt = &b.CompletedAt.Time
	}
	if b.ErrorMessage.Valid {
		resp.ErrorMessage = b.ErrorMessage.String
	}
	return resp
}

func (h *BackupsHandler) List(w http.ResponseWriter, r *http.Request) {
	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	backups, err := h.service.ListBackups(r.Context(), limit)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	response := make([]*BackupResponse, len(backups))
	for i, b := range backups {
		response[i] = toBackupResponse(b)
	}

	core.OK(w, response)
}

type CreateBackupRequest struct {
	DatabaseName string `json:"database_name"`
}

func (h *BackupsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateBackupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.DatabaseName = h.database
	}

	if req.DatabaseName == "" {
		req.DatabaseName = h.database
	}

	backup, err := h.service.TriggerBackup(r.Context(), req.DatabaseName, "manual")
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.Created(w, toBackupResponse(backup))
}

func (h *BackupsHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	backup, err := h.service.GetBackup(r.Context(), id)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}
	if backup == nil {
		core.NotFound(w, "backup")
		return
	}

	core.OK(w, toBackupResponse(backup))
}

func (h *BackupsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.service.DeleteBackup(r.Context(), id); err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.NoContent(w)
}

func (h *BackupsHandler) Restore(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.service.RestoreBackup(r.Context(), id); err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.OK(w, map[string]string{"message": "restore completed"})
}
