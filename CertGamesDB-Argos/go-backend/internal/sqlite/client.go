/*
AngelaMos | 2025
client.go
*/

package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"

	"github.com/carterperez-dev/templates/go-backend/internal/config"
)

type Client struct {
	db *sql.DB
}

func NewClient(cfg config.SQLiteConfig) (*Client, error) {
	dir := filepath.Dir(cfg.Path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("create data directory: %w", err)
	}

	dsn := cfg.Path + "?_journal_mode=WAL&_busy_timeout=5000&_synchronous=NORMAL&_foreign_keys=true"

	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("sqlite open: %w", err)
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("sqlite ping: %w", err)
	}

	client := &Client{db: db}

	if err := client.migrate(); err != nil {
		return nil, fmt.Errorf("sqlite migrate: %w", err)
	}

	return client, nil
}

func (c *Client) Ping(ctx context.Context) error {
	return c.db.PingContext(ctx)
}

func (c *Client) Close() error {
	return c.db.Close()
}

func (c *Client) DB() *sql.DB {
	return c.db
}

func (c *Client) migrate() error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS backups (
			id TEXT PRIMARY KEY,
			database_name TEXT NOT NULL,
			file_path TEXT NOT NULL,
			size_bytes INTEGER,
			started_at TIMESTAMP NOT NULL,
			completed_at TIMESTAMP,
			status TEXT NOT NULL DEFAULT 'pending',
			error_message TEXT,
			triggered_by TEXT NOT NULL DEFAULT 'manual'
		)`,
		`CREATE TABLE IF NOT EXISTS backup_schedules (
			id TEXT PRIMARY KEY,
			database_name TEXT NOT NULL,
			cron_expression TEXT NOT NULL,
			retention_days INTEGER DEFAULT 7,
			enabled INTEGER DEFAULT 1,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_backups_started_at ON backups(started_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status)`,
	}

	for _, migration := range migrations {
		if _, err := c.db.Exec(migration); err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	}

	return nil
}
