/*
AngelaMos | 2026
routes.go
*/

package api

import (
	"io"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/carterperez-dev/holophyly/internal/project"
	"github.com/carterperez-dev/holophyly/internal/websocket"
)

type RouterConfig struct {
	Manager        *project.Manager
	Hub            *websocket.Hub
	Logger         *slog.Logger
	AllowedOrigins []string
}

// NewRouter creates a Chi router with all API routes configured.
func NewRouter(cfg RouterConfig) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(NewLoggingMiddleware(cfg.Logger))
	r.Use(middleware.Recoverer)
	r.Use(middleware.Compress(5))

	origins := cfg.AllowedOrigins
	if len(origins) == 0 {
		origins = []string{"http://localhost:*", "http://127.0.0.1:*"}
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: origins,
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
			"X-Request-ID",
		},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	handler := NewHandler(cfg.Manager, cfg.Logger)

	r.Get("/health", handler.Health)
	r.Get("/ready", handler.Ready)

	r.Route("/api", func(r chi.Router) {
		r.Route("/projects", func(r chi.Router) {
			r.Get("/", handler.ListProjects)
			r.Get("/{id}", handler.GetProject)
			r.Post("/{id}/start", handler.StartProject)
			r.Post("/{id}/stop", handler.StopProject)
			r.Post("/{id}/restart", handler.RestartProject)
			r.Post("/{id}/protect", handler.SetProjectProtection)
			r.Put("/{id}/name", handler.SetProjectDisplayName)
			r.Put("/{id}/hidden", handler.SetProjectHidden)
			r.Get("/{id}/stats", handler.GetProjectStats)
		})

		r.Route("/containers", func(r chi.Router) {
			r.Get("/{id}/logs", handler.GetContainerLogs)
		})

		r.Route("/system", func(r chi.Router) {
			r.Get("/info", handler.GetSystemInfo)
			r.Get("/storage", handler.GetStorageInfo)
			r.Post("/prune", handler.Prune)
			r.Get("/port/{port}", handler.CheckPort)
		})
	})

	if cfg.Hub != nil {
		wsHandler := websocket.NewHTTPHandler(cfg.Hub, cfg.Manager, cfg.Logger)
		r.Get("/ws/stats", wsHandler.HandleWebSocket)
	}

	return r
}

// MountStatic mounts static file serving for the embedded UI.
func MountStatic(r *chi.Mux, fsys http.FileSystem) {
	r.Get("/", func(w http.ResponseWriter, req *http.Request) {
		f, err := fsys.Open("index.html")
		if err != nil {
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}
		defer f.Close()

		stat, err := f.Stat()
		if err != nil {
			http.Error(w, "Internal Error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		http.ServeContent(w, req, "index.html", stat.ModTime(), f.(io.ReadSeeker))
	})

	r.Get("/static/*", http.FileServer(fsys).ServeHTTP)
}
