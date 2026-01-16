/*
AngelaMos | 2026
service.go
*/

package backup

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"

	"github.com/carterperez-dev/templates/go-backend/internal/sqlite"
)

type backupRepository interface {
	Create(ctx context.Context, b *sqlite.Backup) error
	UpdateStatus(ctx context.Context, id, status, filePath string, sizeBytes int64, errorMsg string) error
	GetByID(ctx context.Context, id string) (*sqlite.Backup, error)
	ListRecent(ctx context.Context, limit int) ([]*sqlite.Backup, error)
	Delete(ctx context.Context, id string) error
	DeleteOlderThan(ctx context.Context, days int) (int64, error)
}

type Service struct {
	executor      *Executor
	scheduler     *Scheduler
	repo          backupRepository
	retentionDays int
	logger        *slog.Logger
}

func NewService(executor *Executor, scheduler *Scheduler, repo backupRepository, retentionDays int, logger *slog.Logger) *Service {
	s := &Service{
		executor:      executor,
		scheduler:     scheduler,
		repo:          repo,
		retentionDays: retentionDays,
		logger:        logger,
	}

	scheduler.SetBackupFunc(s.runBackup)

	return s
}

func (s *Service) TriggerBackup(ctx context.Context, dbName, triggeredBy string) (*sqlite.Backup, error) {
	return s.createBackup(ctx, dbName, triggeredBy)
}

func (s *Service) runBackup(ctx context.Context, dbName string) error {
	_, err := s.createBackup(ctx, dbName, "scheduled")
	return err
}

func (s *Service) createBackup(ctx context.Context, dbName, triggeredBy string) (*sqlite.Backup, error) {
	backup := &sqlite.Backup{
		ID:           uuid.New().String(),
		DatabaseName: dbName,
		FilePath:     "",
		SizeBytes:    0,
		StartedAt:    time.Now(),
		Status:       "running",
		TriggeredBy:  triggeredBy,
	}

	if err := s.repo.Create(ctx, backup); err != nil {
		return nil, fmt.Errorf("create backup record: %w", err)
	}

	result, err := s.executor.Execute(ctx, dbName)
	if err != nil {
		s.repo.UpdateStatus(ctx, backup.ID, "failed", "", 0, err.Error())
		return nil, fmt.Errorf("execute backup: %w", err)
	}

	backup.FilePath = result.FilePath
	backup.SizeBytes = result.SizeBytes
	backup.Status = "completed"

	if err := s.repo.UpdateStatus(ctx, backup.ID, "completed", result.FilePath, result.SizeBytes, ""); err != nil {
		return nil, fmt.Errorf("update backup status: %w", err)
	}

	s.logger.Info("backup completed",
		"id", backup.ID,
		"database", dbName,
		"size_bytes", result.SizeBytes,
		"duration", result.Duration,
	)

	go s.cleanupOldBackups()

	return backup, nil
}

func (s *Service) RestoreBackup(ctx context.Context, backupID string) error {
	backup, err := s.repo.GetByID(ctx, backupID)
	if err != nil {
		return fmt.Errorf("get backup: %w", err)
	}
	if backup == nil {
		return fmt.Errorf("backup not found")
	}

	if err := s.executor.Restore(ctx, backup.FilePath, backup.DatabaseName); err != nil {
		return fmt.Errorf("restore backup: %w", err)
	}

	s.logger.Info("backup restored", "id", backupID, "database", backup.DatabaseName)
	return nil
}

func (s *Service) ListBackups(ctx context.Context, limit int) ([]*sqlite.Backup, error) {
	return s.repo.ListRecent(ctx, limit)
}

func (s *Service) GetBackup(ctx context.Context, id string) (*sqlite.Backup, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) DeleteBackup(ctx context.Context, id string) error {
	backup, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("get backup: %w", err)
	}
	if backup == nil {
		return fmt.Errorf("backup not found")
	}

	if err := s.executor.DeleteFile(backup.FilePath); err != nil {
		s.logger.Warn("failed to delete backup file", "path", backup.FilePath, "error", err)
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("delete backup record: %w", err)
	}

	s.logger.Info("backup deleted", "id", id)
	return nil
}

func (s *Service) cleanupOldBackups() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	backups, err := s.repo.ListRecent(ctx, 1000)
	if err != nil {
		s.logger.Error("failed to list backups for cleanup", "error", err)
		return
	}

	cutoff := time.Now().AddDate(0, 0, -s.retentionDays)
	for _, b := range backups {
		if b.StartedAt.Before(cutoff) {
			if err := s.executor.DeleteFile(b.FilePath); err != nil {
				s.logger.Warn("failed to delete old backup file", "path", b.FilePath, "error", err)
			}
			if err := s.repo.Delete(ctx, b.ID); err != nil {
				s.logger.Warn("failed to delete old backup record", "id", b.ID, "error", err)
			} else {
				s.logger.Info("cleaned up old backup", "id", b.ID, "age_days", time.Since(b.StartedAt).Hours()/24)
			}
		}
	}
}

func (s *Service) SetupDailyBackup(dbName string) error {
	return s.scheduler.AddJob("daily-"+dbName, "0 0 0 * * *", dbName)
}

func (s *Service) StartScheduler() {
	s.scheduler.Start()
}

func (s *Service) StopScheduler() context.Context {
	return s.scheduler.Stop()
}
