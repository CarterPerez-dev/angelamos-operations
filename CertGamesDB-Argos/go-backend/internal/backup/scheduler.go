/*
AngelaMos | 2026
scheduler.go
*/

package backup

import (
	"context"
	"log/slog"
	"sync"

	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron       *cron.Cron
	runBackup  func(ctx context.Context, dbName string) error
	jobs       map[string]cron.EntryID
	mu         sync.RWMutex
	logger     *slog.Logger
}

func NewScheduler(logger *slog.Logger) *Scheduler {
	return &Scheduler{
		cron:   cron.New(cron.WithSeconds()),
		jobs:   make(map[string]cron.EntryID),
		logger: logger,
	}
}

func (s *Scheduler) SetBackupFunc(fn func(ctx context.Context, dbName string) error) {
	s.runBackup = fn
}

func (s *Scheduler) AddJob(id, cronExpr, dbName string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if existingID, exists := s.jobs[id]; exists {
		s.cron.Remove(existingID)
	}

	entryID, err := s.cron.AddFunc(cronExpr, func() {
		s.logger.Info("scheduled backup starting", "database", dbName, "schedule_id", id)

		ctx := context.Background()
		if err := s.runBackup(ctx, dbName); err != nil {
			s.logger.Error("scheduled backup failed", "database", dbName, "error", err)
			return
		}

		s.logger.Info("scheduled backup completed", "database", dbName)
	})
	if err != nil {
		return err
	}

	s.jobs[id] = entryID
	return nil
}

func (s *Scheduler) RemoveJob(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if entryID, exists := s.jobs[id]; exists {
		s.cron.Remove(entryID)
		delete(s.jobs, id)
	}
}

func (s *Scheduler) Start() {
	s.cron.Start()
	s.logger.Info("backup scheduler started")
}

func (s *Scheduler) Stop() context.Context {
	s.logger.Info("backup scheduler stopping")
	return s.cron.Stop()
}

func (s *Scheduler) ListJobs() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := make([]string, 0, len(s.jobs))
	for id := range s.jobs {
		ids = append(ids, id)
	}
	return ids
}

func (s *Scheduler) Cron() *cron.Cron {
	return s.cron
}
