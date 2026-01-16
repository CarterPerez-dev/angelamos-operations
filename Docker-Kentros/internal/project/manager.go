/*
AngelaMos | 2026
manager.go
*/

package project

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/carterperez-dev/holophyly/internal/docker"
	"github.com/carterperez-dev/holophyly/internal/model"
	"github.com/carterperez-dev/holophyly/internal/scanner"
	"github.com/carterperez-dev/holophyly/internal/store"
)

type Manager struct {
	docker         *docker.Client
	scanner        *scanner.Scanner
	statsCollector *docker.StatsCollector
	store          *store.Store
	projects       map[string]*model.Project
	protection     *ProtectionConfig
	mu             sync.RWMutex
}

// NewManager creates a project manager that orchestrates docker and scanner.
func NewManager(
	dockerClient *docker.Client,
	fileScanner *scanner.Scanner,
	protection *ProtectionConfig,
	prefStore *store.Store,
) *Manager {
	return &Manager{
		docker:         dockerClient,
		scanner:        fileScanner,
		statsCollector: docker.NewStatsCollector(dockerClient),
		store:          prefStore,
		projects:       make(map[string]*model.Project),
		protection:     protection,
	}
}

// Refresh scans for compose files and updates project state with running containers.
func (m *Manager) Refresh(ctx context.Context) error {
	result, err := m.scanner.Scan(ctx)
	if err != nil {
		return fmt.Errorf("scanning for projects: %w", err)
	}

	containersByProject, err := m.docker.GetContainersByComposeProject(ctx)
	if err != nil {
		return fmt.Errorf("getting containers: %w", err)
	}

	var prefs map[string]*store.ProjectPreference
	if m.store != nil {
		prefs, _ = m.store.GetAllPreferences()
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	newProjects := make(map[string]*model.Project)

	for _, proj := range result.Projects {
		existing, exists := m.projects[proj.ID]
		if exists {
			proj.Protected = existing.Protected
			proj.ProtectionReason = existing.ProtectionReason
		}

		if prefs != nil {
			if pref, ok := prefs[proj.ID]; ok {
				proj.DisplayName = pref.DisplayName
				proj.Hidden = pref.Hidden
			}
		}

		projectName := docker.GetComposeProjectName(proj.ComposeFilePath)
		if containers, ok := containersByProject[projectName]; ok {
			proj.Containers = containers
			proj.Status = determineProjectStatus(containers)
		} else {
			proj.Status = model.StatusStopped
			proj.Containers = []model.Container{}
		}

		m.applyProtection(proj)

		proj.UpdatedAt = time.Now()
		newProjects[proj.ID] = proj
	}

	m.projects = newProjects
	return nil
}

// ListProjects returns all discovered projects sorted by name.
func (m *Manager) ListProjects() []*model.Project {
	m.mu.RLock()
	defer m.mu.RUnlock()

	projects := make([]*model.Project, 0, len(m.projects))
	for _, proj := range m.projects {
		projects = append(projects, proj)
	}

	// Sort by name, then by compose filename for stable ordering
	for i := 0; i < len(projects); i++ {
		for j := i + 1; j < len(projects); j++ {
			swapNeeded := false

			if projects[i].Name > projects[j].Name {
				swapNeeded = true
			} else if projects[i].Name == projects[j].Name {
				if projects[i].ComposeFile > projects[j].ComposeFile {
					swapNeeded = true
				}
			}

			if swapNeeded {
				projects[i], projects[j] = projects[j], projects[i]
			}
		}
	}

	return projects
}

// GetProject returns a single project by ID.
func (m *Manager) GetProject(id string) (*model.Project, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	proj, exists := m.projects[id]
	if !exists {
		return nil, fmt.Errorf("project not found: %s", id)
	}
	return proj, nil
}

// StartProject starts all services in a compose project.
func (m *Manager) StartProject(ctx context.Context, id string) error {
	proj, err := m.GetProject(id)
	if err != nil {
		return err
	}

	result, err := docker.ComposeUp(ctx, proj.ComposeFilePath)
	if err != nil {
		return fmt.Errorf(
			"starting project %s: %w (output: %s)",
			proj.Name,
			err,
			result.Error,
		)
	}

	return m.refreshProject(ctx, id)
}

// StopProject stops all services in a compose project.
// Returns error if project is protected.
func (m *Manager) StopProject(
	ctx context.Context,
	id string,
	force bool,
) error {
	proj, err := m.GetProject(id)
	if err != nil {
		return err
	}

	if proj.Protected && !force {
		return fmt.Errorf(
			"project %s is protected (%s) - use force to override",
			proj.Name,
			proj.ProtectionReason,
		)
	}

	result, err := docker.ComposeDown(ctx, proj.ComposeFilePath)
	if err != nil {
		return fmt.Errorf(
			"stopping project %s: %w (output: %s)",
			proj.Name,
			err,
			result.Error,
		)
	}

	return m.refreshProject(ctx, id)
}

// RestartProject restarts all services in a compose project.
func (m *Manager) RestartProject(ctx context.Context, id string) error {
	proj, err := m.GetProject(id)
	if err != nil {
		return err
	}

	if proj.Protected {
		return fmt.Errorf(
			"project %s is protected (%s) - cannot restart",
			proj.Name,
			proj.ProtectionReason,
		)
	}

	result, err := docker.ComposeRestart(ctx, proj.ComposeFilePath)
	if err != nil {
		return fmt.Errorf(
			"restarting project %s: %w (output: %s)",
			proj.Name,
			err,
			result.Error,
		)
	}

	return m.refreshProject(ctx, id)
}

// SetProjectProtection enables or disables protection for a project.
func (m *Manager) SetProjectProtection(
	id string,
	protected bool,
	reason model.ProtectionReason,
) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	proj, exists := m.projects[id]
	if !exists {
		return fmt.Errorf("project not found: %s", id)
	}

	proj.Protected = protected
	if protected {
		proj.ProtectionReason = reason
	} else {
		proj.ProtectionReason = ""
	}
	proj.UpdatedAt = time.Now()

	return nil
}

// SetProjectDisplayName sets a custom display name for a project.
func (m *Manager) SetProjectDisplayName(id, displayName string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	proj, exists := m.projects[id]
	if !exists {
		return fmt.Errorf("project not found: %s", id)
	}

	if m.store != nil {
		if err := m.store.SetDisplayName(id, displayName); err != nil {
			return fmt.Errorf("saving display name: %w", err)
		}
	}

	proj.DisplayName = displayName
	proj.UpdatedAt = time.Now()

	return nil
}

// SetProjectHidden sets whether a project should be hidden.
func (m *Manager) SetProjectHidden(id string, hidden bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	proj, exists := m.projects[id]
	if !exists {
		return fmt.Errorf("project not found: %s", id)
	}

	if m.store != nil {
		if err := m.store.SetHidden(id, hidden); err != nil {
			return fmt.Errorf("saving hidden status: %w", err)
		}
	}

	proj.Hidden = hidden
	proj.UpdatedAt = time.Now()

	return nil
}

// GetProjectStats returns current stats for all containers in a project.
func (m *Manager) GetProjectStats(
	ctx context.Context,
	id string,
) (map[string]*model.ContainerStats, error) {
	proj, err := m.GetProject(id)
	if err != nil {
		return nil, err
	}

	stats := make(map[string]*model.ContainerStats)
	for _, ctr := range proj.Containers {
		if ctr.State != "running" {
			continue
		}

		ctrStats, err := m.statsCollector.GetStats(ctx, ctr.ID)
		if err != nil {
			continue
		}
		stats[ctr.ID] = ctrStats
	}

	return stats, nil
}

// GetContainerLogs returns logs for a specific container.
func (m *Manager) GetContainerLogs(
	ctx context.Context,
	containerID, tail string,
) (*docker.LogOutput, error) {
	opts := docker.LogOptions{
		Tail:       tail,
		Timestamps: true,
	}
	return m.docker.GetLogs(ctx, containerID, opts)
}

// GetSystemInfo returns Docker daemon information.
func (m *Manager) GetSystemInfo(
	ctx context.Context,
) (*model.SystemInfo, error) {
	return m.docker.GetSystemInfo(ctx)
}

// GetStorageInfo returns Docker storage usage.
func (m *Manager) GetStorageInfo(
	ctx context.Context,
) (*model.StorageInfo, error) {
	return m.docker.GetStorageInfo(ctx)
}

// Prune removes unused Docker resources.
func (m *Manager) Prune(
	ctx context.Context,
	images, volumes, buildCache bool,
) (uint64, error) {
	return m.docker.Prune(ctx, images, volumes, buildCache)
}

// CheckPort checks if a port is available.
func (m *Manager) CheckPort(port uint16) *model.PortCheck {
	return docker.CheckPort(port)
}

// StatsCollector returns the stats collector for streaming stats.
func (m *Manager) StatsCollector() *docker.StatsCollector {
	return m.statsCollector
}

func (m *Manager) refreshProject(ctx context.Context, id string) error {
	containersByProject, err := m.docker.GetContainersByComposeProject(ctx)
	if err != nil {
		return err
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	proj, exists := m.projects[id]
	if !exists {
		return nil
	}

	projectName := docker.GetComposeProjectName(proj.ComposeFilePath)
	if containers, ok := containersByProject[projectName]; ok {
		proj.Containers = containers
		proj.Status = determineProjectStatus(containers)
	} else {
		proj.Containers = []model.Container{}
		proj.Status = model.StatusStopped
	}

	proj.UpdatedAt = time.Now()
	return nil
}

func (m *Manager) applyProtection(proj *model.Project) {
	if proj.Protected {
		return
	}

	if m.protection != nil {
		if m.protection.IsProtected(proj.Path) {
			proj.Protected = true
			proj.ProtectionReason = model.ProtectionUserMarked
			return
		}
	}

	for _, ctr := range proj.Containers {
		if protected, reason := scanner.IsProtectedByPattern(ctr.Name); protected {
			proj.Protected = true
			proj.ProtectionReason = reason
			return
		}

		if protected, reason := scanner.IsProtectedByPattern(ctr.Image); protected {
			proj.Protected = true
			proj.ProtectionReason = reason
			return
		}
	}
}

func determineProjectStatus(containers []model.Container) model.ProjectStatus {
	if len(containers) == 0 {
		return model.StatusStopped
	}

	running := 0
	stopped := 0

	for _, ctr := range containers {
		switch ctr.State {
		case "running":
			running++
		case "exited", "dead", "created":
			stopped++
		}
	}

	if running == len(containers) {
		return model.StatusRunning
	}
	if stopped == len(containers) {
		return model.StatusStopped
	}
	return model.StatusPartial
}
