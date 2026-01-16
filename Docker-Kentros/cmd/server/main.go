/*
AngelaMos | 2026
main.go
*/

package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/carterperez-dev/holophyly/internal/api"
	"github.com/carterperez-dev/holophyly/internal/config"
	"github.com/carterperez-dev/holophyly/internal/docker"
	"github.com/carterperez-dev/holophyly/internal/model"
	"github.com/carterperez-dev/holophyly/internal/project"
	"github.com/carterperez-dev/holophyly/internal/scanner"
	"github.com/carterperez-dev/holophyly/internal/store"
	"github.com/carterperez-dev/holophyly/internal/websocket"
	"github.com/carterperez-dev/holophyly/web"
)

var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	os.Exit(mainRun())
}

func mainRun() int {
	configPath := flag.String("config", "", "path to config file")
	showVersion := flag.Bool("version", false, "show version information")
	flag.Parse()

	if *showVersion {
		fmt.Printf(
			"holophyly %s (commit: %s, built: %s)\n",
			version,
			commit,
			date,
		)
		return 0
	}

	cfg, err := config.Load(*configPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		return 1
	}

	logger := setupLogger(cfg.Logging.Level, cfg.Logging.Format)
	slog.SetDefault(logger)

	ctx, stop := signal.NotifyContext(
		context.Background(),
		syscall.SIGINT,
		syscall.SIGTERM,
	)
	defer stop()

	if err := run(ctx, cfg, logger); err != nil {
		logger.Error("application error", "error", err)
		return 1
	}

	return 0
}

func run(ctx context.Context, cfg *config.Config, logger *slog.Logger) error {
	logger.Info("starting holophyly",
		"version", version,
		"address", cfg.Address(),
	)

	dockerClient, err := docker.NewClient()
	if err != nil {
		return fmt.Errorf("creating docker client: %w", err)
	}
	defer func() { _ = dockerClient.Close() }()

	if err := dockerClient.Ping(ctx); err != nil {
		return fmt.Errorf("docker daemon not available: %w", err)
	}
	logger.Info("connected to docker daemon")

	if !docker.IsComposeInstalled(ctx) {
		logger.Warn("docker compose not found - compose operations will fail")
	}

	dataDir := cfg.DataDir
	if dataDir == "" {
		home, _ := os.UserHomeDir()
		dataDir = filepath.Join(home, ".config", "holophyly")
	}

	prefStore, err := store.New(dataDir)
	if err != nil {
		logger.Warn("failed to initialize preferences store", "error", err)
	} else {
		defer func() { _ = prefStore.Close() }()
		logger.Info("preferences store initialized", "path", dataDir)
	}

	fileScanner := scanner.NewScanner(cfg.Scanner.Paths, cfg.Scanner.Exclude)

	protection := project.NewProtectionConfig(
		cfg.Protection.Patterns,
		cfg.Protection.Projects,
	)

	manager := project.NewManager(dockerClient, fileScanner, protection, prefStore)

	if err := manager.Refresh(ctx); err != nil {
		logger.Warn("initial project scan failed", "error", err)
	} else {
		projects := manager.ListProjects()
		logger.Info("initial scan complete", "projects_found", len(projects))
	}

	hub := websocket.NewHub(logger)
	go hub.Run(ctx)

	router := api.NewRouter(api.RouterConfig{
		Manager:        manager,
		Hub:            hub,
		Logger:         logger,
		AllowedOrigins: cfg.Server.AllowedOrigins,
	})

	api.MountStatic(router, web.FS())

	server := &http.Server{
		Addr:         cfg.Address(),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 10 * time.Minute,
		IdleTimeout:  60 * time.Second,
	}

	go runPeriodicScanner(ctx, manager, cfg.Scanner.ScanInterval, logger)

	go hub.StartStatsStreamer(ctx, createStatsGetter(manager))

	serverErr := make(chan error, 1)
	go func() {
		logger.Info("server listening",
			"host", cfg.Server.Host,
			"port", cfg.Server.Port,
			"url", fmt.Sprintf("http://%s", cfg.Address()),
		)
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			serverErr <- err
		}
		close(serverErr)
	}()

	select {
	case err := <-serverErr:
		return fmt.Errorf("server error: %w", err)
	case <-ctx.Done():
		logger.Info("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(
		context.Background(),
		30*time.Second,
	)
	defer cancel()

	logger.Info("shutting down server")
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", "error", err)
		return fmt.Errorf("shutdown error: %w", err)
	}

	logger.Info("server stopped gracefully")
	return nil
}

func setupLogger(level, format string) *slog.Logger {
	var logLevel slog.Level
	switch level {
	case "debug":
		logLevel = slog.LevelDebug
	case "warn", "warning":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level:     logLevel,
		AddSource: logLevel == slog.LevelDebug,
	}

	var handler slog.Handler
	if format == "json" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	return slog.New(handler)
}

func runPeriodicScanner(
	ctx context.Context,
	manager *project.Manager,
	interval time.Duration,
	logger *slog.Logger,
) {
	if interval <= 0 {
		interval = 30 * time.Second
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := manager.Refresh(ctx); err != nil {
				logger.Error("periodic scan failed", "error", err)
			}
		}
	}
}

func createStatsGetter(
	manager *project.Manager,
) func(context.Context) (map[string]any, error) {
	return func(ctx context.Context) (map[string]any, error) {
		projects := manager.ListProjects()
		allStats := make(map[string]any)

		for _, proj := range projects {
			if proj.Status != model.StatusRunning &&
				proj.Status != model.StatusPartial {
				continue
			}

			stats, err := manager.GetProjectStats(ctx, proj.ID)
			if err != nil {
				continue
			}

			for containerID, containerStats := range stats {
				allStats[containerID] = containerStats
			}
		}

		return allStats, nil
	}
}
