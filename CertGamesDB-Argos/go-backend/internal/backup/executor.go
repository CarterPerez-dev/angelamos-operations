/*
AngelaMos | 2026
executor.go
*/

package backup

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/carterperez-dev/templates/go-backend/internal/config"
)

type Executor struct {
	mongodumpPath    string
	mongorestorePath string
	outputDir        string
	mongoURI         string
}

func NewExecutor(cfg config.BackupConfig, mongoURI string) *Executor {
	return &Executor{
		mongodumpPath:    cfg.MongodumpPath,
		mongorestorePath: cfg.MongorestorePath,
		outputDir:        cfg.OutputDir,
		mongoURI:         mongoURI,
	}
}

type BackupResult struct {
	FilePath  string
	SizeBytes int64
	Duration  time.Duration
}

func (e *Executor) Execute(ctx context.Context, dbName string) (*BackupResult, error) {
	if err := os.MkdirAll(e.outputDir, 0755); err != nil {
		return nil, fmt.Errorf("create output dir: %w", err)
	}

	timestamp := time.Now().Format("2006-01-02_15-04-05")
	filename := fmt.Sprintf("%s_%s.gz", dbName, timestamp)
	outputPath := filepath.Join(e.outputDir, filename)

	start := time.Now()

	cmd := exec.CommandContext(ctx, e.mongodumpPath,
		"--uri", e.mongoURI,
		"--db", dbName,
		"--archive="+outputPath,
		"--gzip",
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("mongodump failed: %w, output: %s", err, string(output))
	}

	info, err := os.Stat(outputPath)
	if err != nil {
		return nil, fmt.Errorf("stat backup file: %w", err)
	}

	return &BackupResult{
		FilePath:  outputPath,
		SizeBytes: info.Size(),
		Duration:  time.Since(start),
	}, nil
}

func (e *Executor) Restore(ctx context.Context, backupPath, dbName string) error {
	cmd := exec.CommandContext(ctx, e.mongorestorePath,
		"--uri", e.mongoURI,
		"--db", dbName,
		"--archive="+backupPath,
		"--gzip",
		"--drop",
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("mongorestore failed: %w, output: %s", err, string(output))
	}

	return nil
}

func (e *Executor) DeleteFile(path string) error {
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("delete backup file: %w", err)
	}
	return nil
}

func (e *Executor) GetFileSize(path string) (int64, error) {
	info, err := os.Stat(path)
	if err != nil {
		return 0, err
	}
	return info.Size(), nil
}
