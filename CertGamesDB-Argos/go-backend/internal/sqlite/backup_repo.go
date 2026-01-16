/*
AngelaMos | 2026
backup_repo.go
*/

package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type BackupRepository struct {
	db *sql.DB
}

func NewBackupRepository(client *Client) *BackupRepository {
	return &BackupRepository{db: client.DB()}
}

type Backup struct {
	ID           string
	DatabaseName string
	FilePath     string
	SizeBytes    int64
	StartedAt    time.Time
	CompletedAt  sql.NullTime
	Status       string
	ErrorMessage sql.NullString
	TriggeredBy  string
}

func (r *BackupRepository) Create(ctx context.Context, b *Backup) error {
	query := `
		INSERT INTO backups (id, database_name, file_path, size_bytes, started_at, status, triggered_by)
		VALUES (?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.ExecContext(ctx, query,
		b.ID,
		b.DatabaseName,
		b.FilePath,
		b.SizeBytes,
		b.StartedAt,
		b.Status,
		b.TriggeredBy,
	)
	if err != nil {
		return fmt.Errorf("insert backup: %w", err)
	}
	return nil
}

func (r *BackupRepository) UpdateStatus(ctx context.Context, id, status, filePath string, sizeBytes int64, errorMsg string) error {
	query := `
		UPDATE backups
		SET status = ?, file_path = ?, size_bytes = ?, completed_at = ?, error_message = ?
		WHERE id = ?`

	completedAt := sql.NullTime{Time: time.Now(), Valid: true}
	errMsgNull := sql.NullString{String: errorMsg, Valid: errorMsg != ""}

	_, err := r.db.ExecContext(ctx, query, status, filePath, sizeBytes, completedAt, errMsgNull, id)
	if err != nil {
		return fmt.Errorf("update backup status: %w", err)
	}
	return nil
}

func (r *BackupRepository) GetByID(ctx context.Context, id string) (*Backup, error) {
	query := `
		SELECT id, database_name, file_path, size_bytes, started_at, completed_at, status, error_message, triggered_by
		FROM backups
		WHERE id = ?`

	var b Backup
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&b.ID,
		&b.DatabaseName,
		&b.FilePath,
		&b.SizeBytes,
		&b.StartedAt,
		&b.CompletedAt,
		&b.Status,
		&b.ErrorMessage,
		&b.TriggeredBy,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get backup by id: %w", err)
	}
	return &b, nil
}

func (r *BackupRepository) ListRecent(ctx context.Context, limit int) ([]*Backup, error) {
	query := `
		SELECT id, database_name, file_path, size_bytes, started_at, completed_at, status, error_message, triggered_by
		FROM backups
		ORDER BY started_at DESC
		LIMIT ?`

	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list backups: %w", err)
	}
	defer rows.Close()

	var backups []*Backup
	for rows.Next() {
		var b Backup
		err := rows.Scan(
			&b.ID,
			&b.DatabaseName,
			&b.FilePath,
			&b.SizeBytes,
			&b.StartedAt,
			&b.CompletedAt,
			&b.Status,
			&b.ErrorMessage,
			&b.TriggeredBy,
		)
		if err != nil {
			return nil, fmt.Errorf("scan backup: %w", err)
		}
		backups = append(backups, &b)
	}
	return backups, nil
}

func (r *BackupRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM backups WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete backup: %w", err)
	}
	return nil
}

func (r *BackupRepository) DeleteOlderThan(ctx context.Context, days int) (int64, error) {
	query := `DELETE FROM backups WHERE started_at < datetime('now', ?)`
	result, err := r.db.ExecContext(ctx, query, fmt.Sprintf("-%d days", days))
	if err != nil {
		return 0, fmt.Errorf("delete old backups: %w", err)
	}
	return result.RowsAffected()
}
