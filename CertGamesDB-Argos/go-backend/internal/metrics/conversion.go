/*
AngelaMos | 2026
conversion.go
*/

package metrics

import (
	"context"
	"fmt"
	"time"

	"github.com/carterperez-dev/templates/go-backend/internal/mongodb"
	"github.com/carterperez-dev/templates/go-backend/internal/sqlite"
)

type ConversionMetric struct {
	UserCount       int       `json:"user_count"`
	RecordedAt      time.Time `json:"recorded_at"`
	TotalUsers      int       `json:"total_users"`
	SubscribedUsers int       `json:"subscribed_users"`
	ConversionRate  float64   `json:"conversion_rate"`
}

type ConversionTrend struct {
	CurrentConversion *ConversionMetric   `json:"current_conversion"`
	DataPoints        []*ConversionMetric `json:"data_points"`
	TotalDataPoints   int                 `json:"total_data_points"`
}

func (s *Service) GetConversionTrend(ctx context.Context, limit int) (*ConversionTrend, error) {
	startDate := time.Date(2026, 1, 8, 0, 0, 0, 0, time.UTC)

	users, err := s.repo.GetUsersForConversion(ctx, s.database, startDate)
	if err != nil {
		return nil, fmt.Errorf("get users for conversion: %w", err)
	}

	if len(users) < 100 {
		return &ConversionTrend{
			CurrentConversion: nil,
			DataPoints:        []*ConversionMetric{},
			TotalDataPoints:   0,
		}, nil
	}

	dataPoints := computeRollingConversion(users, 100, 10)

	var currentConversion *ConversionMetric
	if len(dataPoints) > 0 {
		currentConversion = dataPoints[0]
	}

	if limit > 0 && len(dataPoints) > limit {
		dataPoints = dataPoints[:limit]
	}

	return &ConversionTrend{
		CurrentConversion: currentConversion,
		DataPoints:        dataPoints,
		TotalDataPoints:   len(dataPoints),
	}, nil
}

func computeRollingConversion(users []mongodb.ConversionUser, windowSize, step int) []*ConversionMetric {
	var dataPoints []*ConversionMetric

	for i := len(users); i >= windowSize; i -= step {
		window := users[i-windowSize : i]

		totalUsers := len(window)
		subscribedUsers := 0

		for _, user := range window {
			if user.SubscriptionActive && user.SubscriptionPlatform != "promo" {
				subscribedUsers++
			}
		}

		conversionRate := 0.0
		if totalUsers > 0 {
			conversionRate = (float64(subscribedUsers) / float64(totalUsers)) * 100
		}

		dataPoints = append(dataPoints, &ConversionMetric{
			UserCount:       i,
			RecordedAt:      window[len(window)-1].CreatedAt,
			TotalUsers:      totalUsers,
			SubscribedUsers: subscribedUsers,
			ConversionRate:  conversionRate,
		})
	}

	return dataPoints
}

func (s *Service) CacheConversionTrend(ctx context.Context, conversionRepo *sqlite.ConversionRepository) error {
	startDate := time.Date(2026, 1, 8, 0, 0, 0, 0, time.UTC)

	users, err := s.repo.GetUsersForConversion(ctx, s.database, startDate)
	if err != nil {
		return fmt.Errorf("get users for conversion: %w", err)
	}

	if len(users) < 100 {
		return nil
	}

	lastCachedCount, err := conversionRepo.GetLastUserCount(ctx)
	if err != nil {
		return fmt.Errorf("get last cached count: %w", err)
	}

	dataPoints := computeRollingConversion(users, 100, 10)

	for _, dp := range dataPoints {
		if dp.UserCount > lastCachedCount {
			sqliteDp := &sqlite.ConversionDataPoint{
				UserCount:       dp.UserCount,
				RecordedAt:      dp.RecordedAt,
				TotalUsers:      dp.TotalUsers,
				SubscribedUsers: dp.SubscribedUsers,
				ConversionRate:  dp.ConversionRate,
			}
			if err := conversionRepo.SaveDataPoint(ctx, sqliteDp); err != nil {
				return fmt.Errorf("save conversion data point: %w", err)
			}
		}
	}

	return nil
}

type WeeklyCohortMetric struct {
	Year            int     `json:"year"`
	Week            int     `json:"week"`
	WeekLabel       string  `json:"week_label"`
	TotalUsers      int     `json:"total_users"`
	SubscribedUsers int     `json:"subscribed_users"`
	ConversionRate  float64 `json:"conversion_rate"`
}

type WeeklyCohortTrend struct {
	Cohorts     []*WeeklyCohortMetric `json:"cohorts"`
	TotalCohorts int                  `json:"total_cohorts"`
}

func (s *Service) GetWeeklyCohorts(ctx context.Context, weeks int) (*WeeklyCohortTrend, error) {
	startDate := time.Date(2026, 1, 8, 0, 0, 0, 0, time.UTC)

	if weeks <= 0 {
		weeks = 12
	}

	cohorts, err := s.repo.GetWeeklyCohorts(ctx, s.database, startDate, weeks)
	if err != nil {
		return nil, fmt.Errorf("get weekly cohorts: %w", err)
	}

	var metrics []*WeeklyCohortMetric
	for _, c := range cohorts {
		weekLabel := fmt.Sprintf("%d-W%02d", c.Year, c.Week)
		metrics = append(metrics, &WeeklyCohortMetric{
			Year:            c.Year,
			Week:            c.Week,
			WeekLabel:       weekLabel,
			TotalUsers:      c.TotalUsers,
			SubscribedUsers: c.SubscribedUsers,
			ConversionRate:  c.ConversionRate,
		})
	}

	return &WeeklyCohortTrend{
		Cohorts:     metrics,
		TotalCohorts: len(metrics),
	}, nil
}

type TimeToConversion struct {
	AvgHours    float64 `json:"avg_hours"`
	MedianHours float64 `json:"median_hours"`
	MinHours    float64 `json:"min_hours"`
	MaxHours    float64 `json:"max_hours"`
	TotalUsers  int     `json:"total_users"`
}

func (s *Service) GetTimeToConversion(ctx context.Context) (*TimeToConversion, error) {
	startDate := time.Date(2026, 1, 8, 0, 0, 0, 0, time.UTC)

	users, err := s.repo.GetUsersWithSubscriptionDate(ctx, s.database, startDate)
	if err != nil {
		return nil, fmt.Errorf("get users with subscription date: %w", err)
	}

	if len(users) == 0 {
		return &TimeToConversion{
			AvgHours:   0,
			MedianHours: 0,
			MinHours:   0,
			MaxHours:   0,
			TotalUsers: 0,
		}, nil
	}

	var hours []float64
	var totalHours float64

	for _, user := range users {
		if user.SubscriptionStartDate != nil {
			diff := user.SubscriptionStartDate.Sub(user.CreatedAt)
			h := diff.Hours()
			if h >= 0 {
				hours = append(hours, h)
				totalHours += h
			}
		}
	}

	if len(hours) == 0 {
		return &TimeToConversion{
			AvgHours:   0,
			MedianHours: 0,
			MinHours:   0,
			MaxHours:   0,
			TotalUsers: 0,
		}, nil
	}

	avgHours := totalHours / float64(len(hours))

	minHours := hours[0]
	maxHours := hours[0]
	for _, h := range hours {
		if h < minHours {
			minHours = h
		}
		if h > maxHours {
			maxHours = h
		}
	}

	medianHours := calculateMedian(hours)

	return &TimeToConversion{
		AvgHours:    avgHours,
		MedianHours: medianHours,
		MinHours:    minHours,
		MaxHours:    maxHours,
		TotalUsers:  len(hours),
	}, nil
}

func calculateMedian(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}

	sorted := make([]float64, len(values))
	copy(sorted, values)

	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[i] > sorted[j] {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}

	mid := len(sorted) / 2
	if len(sorted)%2 == 0 {
		return (sorted[mid-1] + sorted[mid]) / 2
	}
	return sorted[mid]
}
