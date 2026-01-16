/*
AngelaMos | 2026
containers.go
*/

package docker

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"

	"github.com/carterperez-dev/holophyly/internal/model"
)

// ListContainers returns all containers, optionally filtered by compose model.
func (c *Client) ListContainers(
	ctx context.Context,
	projectName string,
) ([]model.Container, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	opts := container.ListOptions{All: true}

	if projectName != "" {
		opts.Filters = filters.NewArgs()
		opts.Filters.Add(
			"label",
			fmt.Sprintf("com.docker.compose.project=%s", projectName),
		)
	}

	containers, err := c.cli.ContainerList(ctx, opts)
	if err != nil {
		return nil, fmt.Errorf("listing containers: %w", err)
	}

	result := make([]model.Container, 0, len(containers))
	for _, ctr := range containers {
		result = append(result, containerToProject(ctr))
	}

	return result, nil
}

// GetContainer returns a single container by ID with full details.
func (c *Client) GetContainer(
	ctx context.Context,
	containerID string,
) (*model.Container, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	info, err := c.cli.ContainerInspect(ctx, containerID)
	if err != nil {
		return nil, fmt.Errorf("inspecting container %s: %w", containerID, err)
	}

	ctr := inspectToProject(info)
	return &ctr, nil
}

// StartContainer starts a stopped container.
func (c *Client) StartContainer(ctx context.Context, containerID string) error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if err := c.cli.ContainerStart(ctx, containerID, container.StartOptions{}); err != nil {
		return fmt.Errorf("starting container %s: %w", containerID, err)
	}
	return nil
}

// StopContainer gracefully stops a running container with timeout.
func (c *Client) StopContainer(
	ctx context.Context,
	containerID string,
	timeout time.Duration,
) error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	timeoutSeconds := int(timeout.Seconds())
	if err := c.cli.ContainerStop(ctx, containerID, container.StopOptions{Timeout: &timeoutSeconds}); err != nil {
		return fmt.Errorf("stopping container %s: %w", containerID, err)
	}
	return nil
}

// RestartContainer restarts a container with timeout.
func (c *Client) RestartContainer(
	ctx context.Context,
	containerID string,
	timeout time.Duration,
) error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	timeoutSeconds := int(timeout.Seconds())
	if err := c.cli.ContainerRestart(ctx, containerID, container.StopOptions{Timeout: &timeoutSeconds}); err != nil {
		return fmt.Errorf("restarting container %s: %w", containerID, err)
	}
	return nil
}

// RemoveContainer removes a container, optionally forcing removal of running containers.
func (c *Client) RemoveContainer(
	ctx context.Context,
	containerID string,
	force bool,
) error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	opts := container.RemoveOptions{
		Force:         force,
		RemoveVolumes: false,
	}

	if err := c.cli.ContainerRemove(ctx, containerID, opts); err != nil {
		return fmt.Errorf("removing container %s: %w", containerID, err)
	}
	return nil
}

// GetContainersByComposeProject groups containers by their compose project label.
// Returns a map of project name to containers.
func (c *Client) GetContainersByComposeProject(
	ctx context.Context,
) (map[string][]model.Container, error) {
	containers, err := c.ListContainers(ctx, "")
	if err != nil {
		return nil, err
	}

	grouped := make(map[string][]model.Container)
	for _, ctr := range containers {
		projectName := ctr.Labels["com.docker.compose.project"]
		if projectName == "" {
			projectName = "_standalone"
		}
		grouped[projectName] = append(grouped[projectName], ctr)
	}

	return grouped, nil
}

func containerToProject(ctr container.Summary) model.Container {
	name := ""
	if len(ctr.Names) > 0 {
		name = strings.TrimPrefix(ctr.Names[0], "/")
	}

	ports := make([]model.PortMapping, 0, len(ctr.Ports))
	for _, p := range ctr.Ports {
		ports = append(ports, model.PortMapping{
			HostIP:        p.IP,
			HostPort:      p.PublicPort,
			ContainerPort: p.PrivatePort,
			Protocol:      p.Type,
		})
	}

	state := ctr.State
	health := ""
	switch {
	case strings.Contains(ctr.Status, "(healthy)"):
		health = "healthy"
	case strings.Contains(ctr.Status, "(unhealthy)"):
		health = "unhealthy"
	case strings.Contains(ctr.Status, "(starting)"):
		health = "starting"
	}

	return model.Container{
		ID:          ctr.ID,
		Name:        name,
		ServiceName: ctr.Labels["com.docker.compose.service"],
		Image:       ctr.Image,
		Status:      ctr.Status,
		State:       state,
		Health:      health,
		Ports:       ports,
		Labels:      ctr.Labels,
		CreatedAt:   time.Unix(ctr.Created, 0),
	}
}

func inspectToProject(info container.InspectResponse) model.Container {
	name := strings.TrimPrefix(info.Name, "/")

	ports := make([]model.PortMapping, 0)
	if info.NetworkSettings != nil {
		for portProto, bindings := range info.NetworkSettings.Ports {
			parts := strings.Split(string(portProto), "/")
			containerPort := uint16(0)
			protocol := "tcp"
			if len(parts) >= 1 {
				_, _ = fmt.Sscanf(parts[0], "%d", &containerPort)
			}
			if len(parts) >= 2 {
				protocol = parts[1]
			}

			for _, binding := range bindings {
				hostPort := uint16(0)
				_, _ = fmt.Sscanf(binding.HostPort, "%d", &hostPort)
				ports = append(ports, model.PortMapping{
					HostIP:        binding.HostIP,
					HostPort:      hostPort,
					ContainerPort: containerPort,
					Protocol:      protocol,
				})
			}
		}
	}

	health := ""
	if info.State != nil && info.State.Health != nil {
		health = info.State.Health.Status
	}

	var createdAt, startedAt time.Time
	if info.Created != "" {
		createdAt, _ = time.Parse(time.RFC3339Nano, info.Created)
	}
	if info.State != nil && info.State.StartedAt != "" {
		startedAt, _ = time.Parse(time.RFC3339Nano, info.State.StartedAt)
	}

	state := ""
	status := ""
	if info.State != nil {
		state = info.State.Status
		status = info.State.Status
	}

	labels := make(map[string]string)
	if info.Config != nil {
		labels = info.Config.Labels
	}

	image := ""
	if info.Config != nil {
		image = info.Config.Image
	}

	return model.Container{
		ID:          info.ID,
		Name:        name,
		ServiceName: labels["com.docker.compose.service"],
		Image:       image,
		Status:      status,
		State:       state,
		Health:      health,
		Ports:       ports,
		Labels:      labels,
		CreatedAt:   createdAt,
		StartedAt:   startedAt,
	}
}
