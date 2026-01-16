/*
AngelaMos | 2026
handlers.go
*/

package api

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/carterperez-dev/holophyly/internal/model"
	"github.com/carterperez-dev/holophyly/internal/project"
)

type Handler struct {
	manager *project.Manager
	logger  *slog.Logger
}

// NewHandler creates an API handler with the project manager.
func NewHandler(manager *project.Manager, logger *slog.Logger) *Handler {
	return &Handler{
		manager: manager,
		logger:  logger,
	}
}

func (h *Handler) ListProjects(w http.ResponseWriter, r *http.Request) {
	if err := h.manager.Refresh(r.Context()); err != nil {
		h.logger.Error("failed to refresh projects", "error", err)
	}

	projects := h.manager.ListProjects()
	respondJSON(w, http.StatusOK, projects)
}

func (h *Handler) GetProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	proj, err := h.manager.GetProject(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "project not found")
		return
	}

	respondJSON(w, http.StatusOK, proj)
}

func (h *Handler) StartProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.manager.StartProject(r.Context(), id); err != nil {
		h.logger.Error("failed to start project", "id", id, "error", err)
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	proj, _ := h.manager.GetProject(id)
	respondJSON(w, http.StatusOK, proj)
}

func (h *Handler) StopProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	force := r.URL.Query().Get("force") == "true"

	if err := h.manager.StopProject(r.Context(), id, force); err != nil {
		status := http.StatusInternalServerError
		if !force {
			proj, _ := h.manager.GetProject(id)
			if proj != nil && proj.Protected {
				status = http.StatusForbidden
			}
		}
		h.logger.Error("failed to stop project", "id", id, "error", err)
		respondError(w, status, err.Error())
		return
	}

	proj, _ := h.manager.GetProject(id)
	respondJSON(w, http.StatusOK, proj)
}

func (h *Handler) RestartProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.manager.RestartProject(r.Context(), id); err != nil {
		h.logger.Error("failed to restart project", "id", id, "error", err)
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	proj, _ := h.manager.GetProject(id)
	respondJSON(w, http.StatusOK, proj)
}

func (h *Handler) SetProjectProtection(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Protected bool   `json:"protected"`
		Reason    string `json:"reason,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	reason := model.ProtectionUserMarked
	if req.Reason != "" {
		reason = model.ProtectionReason(req.Reason)
	}

	if err := h.manager.SetProjectProtection(id, req.Protected, reason); err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	proj, _ := h.manager.GetProject(id)
	respondJSON(w, http.StatusOK, proj)
}

func (h *Handler) SetProjectDisplayName(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		DisplayName string `json:"display_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.manager.SetProjectDisplayName(id, req.DisplayName); err != nil {
		h.logger.Error("failed to set display name", "id", id, "error", err)
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	proj, _ := h.manager.GetProject(id)
	respondJSON(w, http.StatusOK, proj)
}

func (h *Handler) SetProjectHidden(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Hidden bool `json:"hidden"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.manager.SetProjectHidden(id, req.Hidden); err != nil {
		h.logger.Error("failed to set hidden status", "id", id, "error", err)
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	proj, _ := h.manager.GetProject(id)
	respondJSON(w, http.StatusOK, proj)
}

func (h *Handler) GetProjectStats(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	stats, err := h.manager.GetProjectStats(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, stats)
}

func (h *Handler) GetContainerLogs(w http.ResponseWriter, r *http.Request) {
	containerID := chi.URLParam(r, "id")
	tail := r.URL.Query().Get("tail")
	if tail == "" {
		tail = "100"
	}

	logs, err := h.manager.GetContainerLogs(r.Context(), containerID, tail)
	if err != nil {
		h.logger.Error(
			"failed to get logs",
			"container",
			containerID,
			"error",
			err,
		)
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, logs)
}

func (h *Handler) GetSystemInfo(w http.ResponseWriter, r *http.Request) {
	info, err := h.manager.GetSystemInfo(r.Context())
	if err != nil {
		h.logger.Error("failed to get system info", "error", err)
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, info)
}

func (h *Handler) GetStorageInfo(w http.ResponseWriter, r *http.Request) {
	info, err := h.manager.GetStorageInfo(r.Context())
	if err != nil {
		h.logger.Error("failed to get storage info", "error", err)
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, info)
}

func (h *Handler) Prune(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Images     bool `json:"images"`
		Volumes    bool `json:"volumes"`
		BuildCache bool `json:"build_cache"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Images = true
		req.BuildCache = true
	}

	reclaimed, err := h.manager.Prune(
		r.Context(),
		req.Images,
		req.Volumes,
		req.BuildCache,
	)
	if err != nil {
		h.logger.Error("failed to prune", "error", err)
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"reclaimed_bytes": reclaimed,
		"reclaimed_mb":    float64(reclaimed) / 1024 / 1024,
	})
}

func (h *Handler) CheckPort(w http.ResponseWriter, r *http.Request) {
	portStr := chi.URLParam(r, "port")
	port, err := strconv.ParseUint(portStr, 10, 16)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid port number")
		return
	}

	result := h.manager.CheckPort(uint16(port))
	respondJSON(w, http.StatusOK, result)
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Ready(w http.ResponseWriter, r *http.Request) {
	if _, err := h.manager.GetSystemInfo(r.Context()); err != nil {
		respondError(w, http.StatusServiceUnavailable, "docker not available")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
