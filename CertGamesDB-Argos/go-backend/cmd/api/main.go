/*
AngelaMos | 2026
main.go
*/

package main

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"github.com/carterperez-dev/templates/go-backend/internal/backup"
	"github.com/carterperez-dev/templates/go-backend/internal/cleanup"
	"github.com/carterperez-dev/templates/go-backend/internal/config"
	"github.com/carterperez-dev/templates/go-backend/internal/handler"
	"github.com/carterperez-dev/templates/go-backend/internal/health"
	"github.com/carterperez-dev/templates/go-backend/internal/metrics"
	"github.com/carterperez-dev/templates/go-backend/internal/middleware"
	"github.com/carterperez-dev/templates/go-backend/internal/mongodb"
	"github.com/carterperez-dev/templates/go-backend/internal/server"
	"github.com/carterperez-dev/templates/go-backend/internal/sqlite"
	"github.com/carterperez-dev/templates/go-backend/internal/websocket"
)

const (
	drainDelay = 5 * time.Second
)

func main() {
	configPath := flag.String("config", "config.yaml", "path to config file")
	flag.Parse()

	if err := run(*configPath); err != nil {
		slog.Error("application error", "error", err)
		os.Exit(1)
	}
}

func run(configPath string) error {
	ctx, stop := signal.NotifyContext(
		context.Background(),
		syscall.SIGINT,
		syscall.SIGTERM,
	)
	defer stop()

	_ = godotenv.Load()

	cfg, err := config.Load(configPath)
	if err != nil {
		return err
	}

	logger := setupLogger(cfg.Log)
	slog.SetDefault(logger)

	logger.Info("starting application",
		"name", cfg.App.Name,
		"version", cfg.App.Version,
		"environment", cfg.App.Environment,
	)

	mongoClient, err := mongodb.NewClient(ctx, cfg.Mongo)
	if err != nil {
		return err
	}
	logger.Info("mongodb connected",
		"database", cfg.Mongo.Database,
		"max_pool_size", cfg.Mongo.MaxPoolSize,
	)

	sqliteClient, err := sqlite.NewClient(cfg.SQLite)
	if err != nil {
		return err
	}
	logger.Info("sqlite connected",
		"path", cfg.SQLite.Path,
	)

	healthHandler := health.NewHandler(mongoClient, sqliteClient)

	metricsRepo := mongodb.NewMetricsRepository(mongoClient)
	metricsSvc := metrics.NewService(metricsRepo, cfg.Mongo.Database)
	metricsHandler := handler.NewMetricsHandler(metricsSvc)

	backupRepo := sqlite.NewBackupRepository(sqliteClient)
	backupExecutor := backup.NewExecutor(cfg.Backup, cfg.Mongo.URI)
	backupScheduler := backup.NewScheduler(logger)
	backupSvc := backup.NewService(backupExecutor, backupScheduler, backupRepo, cfg.Backup.RetentionDays, logger)
	backupsHandler := handler.NewBackupsHandler(backupSvc, cfg.Mongo.Database)

	collectionsRepo := mongodb.NewCollectionsRepository(mongoClient)
	collectionsHandler := handler.NewCollectionsHandler(collectionsRepo, cfg.Mongo.Database)

	cleanupSvc := cleanup.NewService(mongoClient.Client(), cfg.Mongo.Database, 30, logger)

	wsHub := websocket.NewHub(logger)
	go wsHub.Run(ctx)

	wsHandler := websocket.NewHandler(wsHub, logger)

	metricsGetter := func(ctx context.Context) (any, error) {
		return metricsSvc.GetDashboardMetrics(ctx)
	}
	broadcaster := websocket.NewMetricsBroadcaster(wsHub, metricsGetter, 2000, logger)
	broadcaster.Start(ctx)
	logger.Info("websocket broadcaster started", "interval_ms", 2000)

	srv := server.New(server.Config{
		ServerConfig:  cfg.Server,
		HealthHandler: healthHandler,
		Logger:        logger,
	})

	router := srv.Router()

	router.Use(middleware.RequestID)
	router.Use(middleware.Logger(logger))
	router.Use(middleware.SecurityHeaders(cfg.App.Environment == "production"))
	router.Use(middleware.CORS(cfg.CORS))

	healthHandler.RegisterRoutes(router)
	metricsHandler.RegisterRoutes(router)
	backupsHandler.RegisterRoutes(router)
	collectionsHandler.RegisterRoutes(router)
	router.Handle("/ws", wsHandler)

	backupSvc.StartScheduler()
	if err := backupSvc.SetupDailyBackup(cfg.Mongo.Database); err != nil {
		logger.Warn("failed to setup daily backup", "error", err)
	}

	_, err = backupScheduler.Cron().AddFunc("0 20 21 * * *", func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		logger.Info("starting scheduled cleanup task")
		_, cleanupErr := cleanupSvc.CleanOldDocuments(cleanupCtx)
		if cleanupErr != nil {
			logger.Error("scheduled cleanup failed", "error", cleanupErr)
		}
	})
	if err != nil {
		logger.Warn("failed to setup daily cleanup", "error", err)
	} else {
		logger.Info("daily cleanup scheduled", "time", "3:05 PM")
	}

	errChan := make(chan error, 1)
	go func() {
		errChan <- srv.Start()
	}()

	select {
	case err := <-errChan:
		return err
	case <-ctx.Done():
		logger.Info("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(
		context.Background(),
		cfg.Server.ShutdownTimeout+drainDelay+5*time.Second,
	)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx, drainDelay); err != nil {
		logger.Error("server shutdown error", "error", err)
	}

	schedulerCtx := backupSvc.StopScheduler()
	<-schedulerCtx.Done()
	logger.Info("backup scheduler stopped")

	if err := mongoClient.Close(shutdownCtx); err != nil {
		logger.Error("mongodb close error", "error", err)
	}

	if err := sqliteClient.Close(); err != nil {
		logger.Error("sqlite close error", "error", err)
	}

	logger.Info("application stopped")
	return nil
}

func setupLogger(cfg config.LogConfig) *slog.Logger {
	var handler slog.Handler

	level := slog.LevelInfo
	switch cfg.Level {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	}

	opts := &slog.HandlerOptions{Level: level}

	if cfg.Format == "json" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	return slog.New(handler)
}
