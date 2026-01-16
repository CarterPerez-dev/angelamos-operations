/*
AngelaMos | 2026
protected.go
*/

package project

import (
	"path/filepath"
	"strings"
)

type ProtectionConfig struct {
	Patterns []string
	Projects []string
}

// NewProtectionConfig creates a protection configuration.
func NewProtectionConfig(patterns, projects []string) *ProtectionConfig {
	return &ProtectionConfig{
		Patterns: patterns,
		Projects: projects,
	}
}

// IsProtected checks if a project path matches protection rules.
func (p *ProtectionConfig) IsProtected(projectPath string) bool {
	if p == nil {
		return false
	}

	normalizedPath := normalizePath(projectPath)

	for _, protectedPath := range p.Projects {
		if normalizePath(protectedPath) == normalizedPath {
			return true
		}
	}

	for _, pattern := range p.Patterns {
		matched, err := filepath.Match(
			strings.ToLower(pattern),
			strings.ToLower(filepath.Base(projectPath)),
		)
		if err == nil && matched {
			return true
		}

		if strings.Contains(
			strings.ToLower(projectPath),
			strings.ToLower(pattern),
		) {
			return true
		}
	}

	return false
}

// AddProtectedProject adds a project path to the protection list.
func (p *ProtectionConfig) AddProtectedProject(projectPath string) {
	normalized := normalizePath(projectPath)
	for _, existing := range p.Projects {
		if normalizePath(existing) == normalized {
			return
		}
	}
	p.Projects = append(p.Projects, projectPath)
}

// RemoveProtectedProject removes a project path from the protection list.
func (p *ProtectionConfig) RemoveProtectedProject(projectPath string) {
	normalized := normalizePath(projectPath)
	filtered := make([]string, 0, len(p.Projects))
	for _, existing := range p.Projects {
		if normalizePath(existing) != normalized {
			filtered = append(filtered, existing)
		}
	}
	p.Projects = filtered
}

// AddPattern adds a protection pattern.
func (p *ProtectionConfig) AddPattern(pattern string) {
	for _, existing := range p.Patterns {
		if existing == pattern {
			return
		}
	}
	p.Patterns = append(p.Patterns, pattern)
}

// RemovePattern removes a protection pattern.
func (p *ProtectionConfig) RemovePattern(pattern string) {
	filtered := make([]string, 0, len(p.Patterns))
	for _, existing := range p.Patterns {
		if existing != pattern {
			filtered = append(filtered, existing)
		}
	}
	p.Patterns = filtered
}

func normalizePath(path string) string {
	path = filepath.Clean(path)

	if strings.HasPrefix(path, "~/") {
		return path
	}

	return strings.TrimSuffix(path, "/")
}
