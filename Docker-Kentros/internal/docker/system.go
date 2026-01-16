/*
AngelaMos | 2026
system.go
*/

package docker

import (
	"bufio"
	"context"
	"fmt"
	"net"
	"os/exec"
	"strconv"
	"strings"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/build"
	"github.com/docker/docker/api/types/filters"

	"github.com/carterperez-dev/holophyly/internal/model"
)

// GetSystemInfo returns Docker daemon system information.
func (c *Client) GetSystemInfo(ctx context.Context) (*model.SystemInfo, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	info, err := c.cli.Info(ctx)
	if err != nil {
		return nil, fmt.Errorf("getting system info: %w", err)
	}

	version, err := c.cli.ServerVersion(ctx)
	if err != nil {
		return nil, fmt.Errorf("getting server version: %w", err)
	}

	return &model.SystemInfo{
		DockerVersion:     version.Version,
		APIVersion:        version.APIVersion,
		OS:                info.OperatingSystem,
		Arch:              info.Architecture,
		Containers:        info.Containers,
		ContainersRunning: info.ContainersRunning,
		ContainersPaused:  info.ContainersPaused,
		ContainersStopped: info.ContainersStopped,
		Images:            info.Images,
	}, nil
}

// GetStorageInfo returns disk usage information for Docker resources.
func (c *Client) GetStorageInfo(
	ctx context.Context,
) (*model.StorageInfo, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	usage, err := c.cli.DiskUsage(ctx, types.DiskUsageOptions{})
	if err != nil {
		return nil, fmt.Errorf("getting disk usage: %w", err)
	}

	info := &model.StorageInfo{
		Details: model.StorageDetails{
			Images:     make([]model.ImageInfo, 0),
			Volumes:    make([]model.VolumeInfo, 0),
			BuildCache: make([]model.CacheInfo, 0),
		},
	}

	for _, img := range usage.Images {
		info.ImagesSize += uint64(img.Size)
		repoTag := "<none>:<none>"
		repo := "<none>"
		tag := "<none>"
		if len(img.RepoTags) > 0 {
			repoTag = img.RepoTags[0]
			parts := strings.Split(repoTag, ":")
			if len(parts) >= 1 {
				repo = parts[0]
			}
			if len(parts) >= 2 {
				tag = parts[1]
			}
		}

		info.Details.Images = append(info.Details.Images, model.ImageInfo{
			ID:         img.ID,
			Repository: repo,
			Tag:        tag,
			Size:       uint64(img.Size),
			InUse:      img.Containers > 0,
		})
	}

	for _, ctr := range usage.Containers {
		info.ContainersSize += uint64(ctr.SizeRw)
	}

	for _, vol := range usage.Volumes {
		size := int64(0)
		if vol.UsageData != nil {
			size = vol.UsageData.Size
		}
		info.VolumesSize += uint64(size)

		inUse := false
		if vol.UsageData != nil {
			inUse = vol.UsageData.RefCount > 0
		}

		info.Details.Volumes = append(info.Details.Volumes, model.VolumeInfo{
			Name:   vol.Name,
			Driver: vol.Driver,
			Size:   uint64(size),
			InUse:  inUse,
		})
	}

	for _, cache := range usage.BuildCache {
		info.BuildCacheSize += uint64(cache.Size)

		info.Details.BuildCache = append(
			info.Details.BuildCache,
			model.CacheInfo{
				ID:    cache.ID,
				Type:  cache.Type,
				Size:  uint64(cache.Size),
				InUse: cache.InUse,
			},
		)
	}

	info.TotalSize = info.ImagesSize + info.ContainersSize + info.VolumesSize + info.BuildCacheSize

	unusedImages := uint64(0)
	for _, img := range usage.Images {
		if img.Containers == 0 {
			unusedImages += uint64(img.Size)
		}
	}
	info.Reclaimable = unusedImages + info.BuildCacheSize

	return info, nil
}

// Prune removes unused Docker resources.
// Returns the amount of space reclaimed in bytes.
func (c *Client) Prune(
	ctx context.Context,
	pruneImages, pruneVolumes, pruneBuildCache bool,
) (uint64, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	var totalReclaimed uint64

	containerReport, err := c.cli.ContainersPrune(ctx, filters.Args{})
	if err != nil {
		return 0, fmt.Errorf("pruning containers: %w", err)
	}
	totalReclaimed += containerReport.SpaceReclaimed

	if pruneImages {
		imageReport, err := c.cli.ImagesPrune(
			ctx,
			filters.NewArgs(filters.Arg("dangling", "false")),
		)
		if err != nil {
			return totalReclaimed, fmt.Errorf("pruning images: %w", err)
		}
		totalReclaimed += imageReport.SpaceReclaimed
	}

	if pruneVolumes {
		volumeReport, err := c.cli.VolumesPrune(ctx, filters.Args{})
		if err != nil {
			return totalReclaimed, fmt.Errorf("pruning volumes: %w", err)
		}
		totalReclaimed += volumeReport.SpaceReclaimed
	}

	if pruneBuildCache {
		buildReport, err := c.cli.BuildCachePrune(
			ctx,
			build.CachePruneOptions{All: true},
		)
		if err != nil {
			return totalReclaimed, fmt.Errorf("pruning build cache: %w", err)
		}
		totalReclaimed += buildReport.SpaceReclaimed
	}

	networkReport, err := c.cli.NetworksPrune(ctx, filters.Args{})
	if err != nil {
		return totalReclaimed, fmt.Errorf("pruning networks: %w", err)
	}
	_ = networkReport

	return totalReclaimed, nil
}

// CheckPort checks if a port is available or in use.
// Returns port availability status with process info if in use.
func CheckPort(port uint16) *model.PortCheck {
	result := &model.PortCheck{
		Port:      port,
		Available: true,
	}

	addr := fmt.Sprintf(":%d", port)

	listener, err := net.Listen("tcp", addr)
	if err != nil {
		result.Available = false
		result.Process, result.PID = getProcessUsingPort(port)
		return result
	}
	_ = listener.Close()

	return result
}

func getProcessUsingPort(port uint16) (string, int) {
	cmd := exec.Command("ss", "-tlnp", fmt.Sprintf("sport = :%d", port))
	output, err := cmd.Output()
	if err != nil {
		cmd = exec.Command("netstat", "-tlnp")
		output, _ = cmd.Output()
	}

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	portStr := fmt.Sprintf(":%d", port)

	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, portStr) {
			parts := strings.Fields(line)
			for _, part := range parts {
				if strings.Contains(part, "pid=") ||
					strings.Contains(part, "/") {
					if strings.Contains(part, "/") {
						pidParts := strings.Split(part, "/")
						if len(pidParts) >= 2 {
							pid, _ := strconv.Atoi(
								strings.TrimPrefix(pidParts[0], "pid="),
							)
							return pidParts[1], pid
						}
					}
				}
			}
		}
	}

	return "unknown", 0
}
