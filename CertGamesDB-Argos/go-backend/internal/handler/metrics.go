/*
AngelaMos | 2026
metrics.go
*/

package handler

import (
	"context"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/carterperez-dev/templates/go-backend/internal/core"
	"github.com/carterperez-dev/templates/go-backend/internal/metrics"
)

type metricsService interface {
	GetDashboardMetrics(ctx context.Context) (*metrics.DashboardMetrics, error)
	GetSlowQueries(ctx context.Context, minMillis, limit int) (*metrics.SlowQueryReport, error)
	GetProfilingStatus(ctx context.Context) (*metrics.ProfilingStatus, error)
	SetProfilingLevel(ctx context.Context, level, slowMs int) error
	AnalyzeSlowQueries(ctx context.Context, minMillis, limit int) (*metrics.SlowQueryAnalysis, error)
}

type MetricsHandler struct {
	service metricsService
}

func NewMetricsHandler(service metricsService) *MetricsHandler {
	return &MetricsHandler{service: service}
}

func (h *MetricsHandler) RegisterRoutes(r chi.Router) {
	r.Route("/api/metrics", func(r chi.Router) {
		r.Get("/", h.GetMetrics)
		r.Get("/slow-queries", h.GetSlowQueries)
		r.Get("/slow-queries/analyze", h.AnalyzeSlowQueries)
		r.Get("/profiling", h.GetProfilingStatus)
		r.Put("/profiling", h.SetProfilingLevel)
	})
}

func (h *MetricsHandler) GetMetrics(w http.ResponseWriter, r *http.Request) {
	m, err := h.service.GetDashboardMetrics(r.Context())
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.OK(w, m)
}

func (h *MetricsHandler) GetSlowQueries(w http.ResponseWriter, r *http.Request) {
	minMillis := 100
	if v := r.URL.Query().Get("min_millis"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 {
			minMillis = parsed
		}
	}

	limit := 50
	if v := r.URL.Query().Get("limit"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}

	report, err := h.service.GetSlowQueries(r.Context(), minMillis, limit)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.OK(w, report)
}

func (h *MetricsHandler) AnalyzeSlowQueries(w http.ResponseWriter, r *http.Request) {
	minMillis := 100
	if v := r.URL.Query().Get("min_millis"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 {
			minMillis = parsed
		}
	}

	limit := 100
	if v := r.URL.Query().Get("limit"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 && parsed <= 1000 {
			limit = parsed
		}
	}

	analysis, err := h.service.AnalyzeSlowQueries(r.Context(), minMillis, limit)
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.OK(w, analysis)
}

func (h *MetricsHandler) GetProfilingStatus(w http.ResponseWriter, r *http.Request) {
	status, err := h.service.GetProfilingStatus(r.Context())
	if err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.OK(w, status)
}

type SetProfilingRequest struct {
	Level  int `json:"level"`
	SlowMs int `json:"slow_ms"`
}

func (h *MetricsHandler) SetProfilingLevel(w http.ResponseWriter, r *http.Request) {
	var req SetProfilingRequest
	if err := core.DecodeJSON(r, &req); err != nil {
		core.BadRequest(w, "invalid request body")
		return
	}

	if req.Level < 0 || req.Level > 2 {
		core.BadRequest(w, "level must be 0, 1, or 2")
		return
	}

	if err := h.service.SetProfilingLevel(r.Context(), req.Level, req.SlowMs); err != nil {
		core.InternalServerError(w, err)
		return
	}

	core.OK(w, map[string]string{"status": "profiling level updated"})
}
