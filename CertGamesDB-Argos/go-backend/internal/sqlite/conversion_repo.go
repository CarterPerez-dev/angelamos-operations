/*
AngelaMos | 2026
conversion_repo.go
*/

package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type ConversionRepository struct {
	db *sql.DB
}

func NewConversionRepository(client *Client) *ConversionRepository {
	return &ConversionRepository{db: client.DB()}
}

type ConversionDataPoint struct {
	UserCount       int
	RecordedAt      time.Time
	TotalUsers      int
	SubscribedUsers int
	ConversionRate  float64
}

func (r *ConversionRepository) GetLastUserCount(ctx context.Context) (int, error) {
	query := `SELECT user_count FROM conversion_metrics ORDER BY user_count DESC LIMIT 1`

	var count int
	err := r.db.QueryRowContext(ctx, query).Scan(&count)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("get last user count: %w", err)
	}
	return count, nil
}

func (r *ConversionRepository) SaveDataPoint(ctx context.Context, dp *ConversionDataPoint) error {
	query := `
		INSERT OR REPLACE INTO conversion_metrics (user_count, recorded_at, total_users, subscribed_users, conversion_rate)
		VALUES (?, ?, ?, ?, ?)`

	_, err := r.db.ExecContext(ctx, query,
		dp.UserCount,
		dp.RecordedAt,
		dp.TotalUsers,
		dp.SubscribedUsers,
		dp.ConversionRate,
	)
	if err != nil {
		return fmt.Errorf("save conversion data point: %w", err)
	}
	return nil
}

func (r *ConversionRepository) ListRecent(ctx context.Context, limit int) ([]*ConversionDataPoint, error) {
	query := `
		SELECT user_count, recorded_at, total_users, subscribed_users, conversion_rate
		FROM conversion_metrics
		ORDER BY user_count DESC
		LIMIT ?`

	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list conversion metrics: %w", err)
	}
	defer rows.Close()

	var dataPoints []*ConversionDataPoint
	for rows.Next() {
		var dp ConversionDataPoint
		err := rows.Scan(
			&dp.UserCount,
			&dp.RecordedAt,
			&dp.TotalUsers,
			&dp.SubscribedUsers,
			&dp.ConversionRate,
		)
		if err != nil {
			return nil, fmt.Errorf("scan conversion metric: %w", err)
		}
		dataPoints = append(dataPoints, &dp)
	}
	return dataPoints, nil
}
