/*
AngelaMos | 2026
stats.go
*/

package docker

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"

	"github.com/carterperez-dev/holophyly/internal/model"
)

type StatsCollector struct {
	client    *Client
	prevStats map[string]*container.StatsResponse
	mu        sync.RWMutex
}

// NewStatsCollector creates a collector that tracks previous stats for delta calculations.
func NewStatsCollector(client *Client) *StatsCollector {
	return &StatsCollector{
		client:    client,
		prevStats: make(map[string]*container.StatsResponse),
	}
}

// GetStats retrieves current stats for a container with proper CPU percentage calculation.
// The Docker API returns cumulative CPU values, so we calculate delta from previous reading.
func (s *StatsCollector) GetStats(
	ctx context.Context,
	containerID string,
) (*model.ContainerStats, error) {
	s.client.mu.RLock()
	cli := s.client.cli
	s.client.mu.RUnlock()

	resp, err := cli.ContainerStats(ctx, containerID, false)
	if err != nil {
		return nil, fmt.Errorf("getting stats for %s: %w", containerID, err)
	}
	defer func() { _ = resp.Body.Close() }()

	var stats container.StatsResponse
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return nil, fmt.Errorf("decoding stats for %s: %w", containerID, err)
	}

	s.mu.Lock()
	prev := s.prevStats[containerID]
	s.prevStats[containerID] = &stats
	s.mu.Unlock()

	return calculateStats(prev, &stats), nil
}

// StreamStats continuously streams stats for a container.
// Returns a channel that receives stats updates until context is cancelled.
func (s *StatsCollector) StreamStats(
	ctx context.Context,
	containerID string,
) (<-chan *model.ContainerStats, <-chan error) {
	statsCh := make(chan *model.ContainerStats)
	errCh := make(chan error, 1)

	go func() {
		defer close(statsCh)
		defer close(errCh)

		s.client.mu.RLock()
		cli := s.client.cli
		s.client.mu.RUnlock()

		resp, err := cli.ContainerStats(ctx, containerID, true)
		if err != nil {
			errCh <- fmt.Errorf("streaming stats for %s: %w", containerID, err)
			return
		}
		defer func() { _ = resp.Body.Close() }()

		decoder := json.NewDecoder(resp.Body)
		var prev *container.StatsResponse

		for {
			select {
			case <-ctx.Done():
				return
			default:
			}

			var stats container.StatsResponse
			if err := decoder.Decode(&stats); err != nil {
				if err == io.EOF {
					return
				}
				errCh <- fmt.Errorf("decoding streamed stats: %w", err)
				return
			}

			calculated := calculateStats(prev, &stats)
			prev = &stats

			select {
			case statsCh <- calculated:
			case <-ctx.Done():
				return
			}
		}
	}()

	return statsCh, errCh
}

// calculateStats converts raw Docker stats to our ContainerStats format.
// CPU percentage requires delta calculation between consecutive readings.
func calculateStats(prev, curr *container.StatsResponse) *model.ContainerStats {
	if curr == nil {
		return nil
	}

	stats := &model.ContainerStats{
		MemoryUsage: curr.MemoryStats.Usage,
		MemoryLimit: curr.MemoryStats.Limit,
		PIDs:        curr.PidsStats.Current,
		Timestamp:   time.Now(),
	}

	if stats.MemoryLimit > 0 {
		stats.MemoryPercent = float64(
			stats.MemoryUsage,
		) / float64(
			stats.MemoryLimit,
		) * 100.0
	}

	stats.CPUPercent = calculateCPUPercent(prev, curr)

	stats.NetworkRx, stats.NetworkTx = calculateNetworkIO(curr)
	stats.BlockRead, stats.BlockWrite = calculateBlockIO(curr)

	return stats
}

// calculateCPUPercent computes CPU usage percentage from cumulative values.
// Docker returns cumulative CPU nanoseconds, so we need delta calculation.
func calculateCPUPercent(prev, curr *container.StatsResponse) float64 {
	if prev == nil || curr == nil {
		return 0.0
	}

	cpuDelta := float64(
		curr.CPUStats.CPUUsage.TotalUsage - prev.CPUStats.CPUUsage.TotalUsage,
	)
	systemDelta := float64(
		curr.CPUStats.SystemUsage - prev.CPUStats.SystemUsage,
	)

	if systemDelta > 0 && cpuDelta > 0 {
		cpuCount := float64(curr.CPUStats.OnlineCPUs)
		if cpuCount == 0 {
			cpuCount = float64(len(curr.CPUStats.CPUUsage.PercpuUsage))
		}
		if cpuCount == 0 {
			cpuCount = 1.0
		}
		return (cpuDelta / systemDelta) * cpuCount * 100.0
	}

	return 0.0
}

func calculateNetworkIO(stats *container.StatsResponse) (rx, tx uint64) {
	for _, network := range stats.Networks {
		rx += network.RxBytes
		tx += network.TxBytes
	}
	return rx, tx
}

func calculateBlockIO(stats *container.StatsResponse) (read, write uint64) {
	for _, bio := range stats.BlkioStats.IoServiceBytesRecursive {
		switch bio.Op {
		case "read", "Read":
			read += bio.Value
		case "write", "Write":
			write += bio.Value
		}
	}
	return read, write
}

// ClearPreviousStats removes stored previous stats for a container.
// Call this when a container is stopped/removed.
func (s *StatsCollector) ClearPreviousStats(containerID string) {
	s.mu.Lock()
	delete(s.prevStats, containerID)
	s.mu.Unlock()
}
