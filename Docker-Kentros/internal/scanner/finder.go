/*
AngelaMos | 2026
finder.go
*/

package scanner

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io/fs"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/compose-spec/compose-go/v2/cli"

	"github.com/carterperez-dev/holophyly/internal/model"
)

type Scanner struct {
	paths   []string
	exclude []string
	mu      sync.RWMutex
	cache   map[string]*CachedProject
}

type CachedProject struct {
	Project  *model.Project
	ModTime  time.Time
	CheckSum string
}

type ScanResult struct {
	Projects []*model.Project
	Errors   []ScanError
	Duration time.Duration
}

type ScanError struct {
	Path  string `json:"path"`
	Error string `json:"error"`
}

// NewScanner creates a scanner for discovering compose files.
func NewScanner(paths, exclude []string) *Scanner {
	if len(exclude) == 0 {
		exclude = defaultExcludes()
	}

	return &Scanner{
		paths:   paths,
		exclude: exclude,
		cache:   make(map[string]*CachedProject),
	}
}

// Scan discovers all compose files in configured paths.
// Uses content-based detection - parses YAML and checks for services key.
func (s *Scanner) Scan(ctx context.Context) (*ScanResult, error) {
	start := time.Now()
	result := &ScanResult{
		Projects: make([]*model.Project, 0),
		Errors:   make([]ScanError, 0),
	}

	logger := slog.Default()

	yamlFiles := make([]string, 0)

	for _, scanPath := range s.paths {
		expanded := expandPath(scanPath)

		err := filepath.WalkDir(
			expanded,
			func(path string, d fs.DirEntry, err error) error {
				if err != nil {
					return nil
				}

				select {
				case <-ctx.Done():
					return ctx.Err()
				default:
				}

				if d.IsDir() {
					if s.shouldExcludeDir(d.Name()) {
						return filepath.SkipDir
					}
					return nil
				}

				if isYAMLFile(path) {
					yamlFiles = append(yamlFiles, path)
				}

				return nil
			},
		)

		if err != nil && err != context.Canceled {
			result.Errors = append(result.Errors, ScanError{
				Path:  scanPath,
				Error: fmt.Sprintf("walking directory: %v", err),
			})
		}
	}

	for _, yamlPath := range yamlFiles {
		select {
		case <-ctx.Done():
			result.Duration = time.Since(start)
			return result, ctx.Err()
		default:
		}

		proj, err := s.parseComposeFile(ctx, yamlPath)
		if err != nil {
			logger.Debug("skipping compose file", "path", yamlPath, "error", err)
			continue
		}

		if proj != nil {
			result.Projects = append(result.Projects, proj)
		}
	}

	result.Duration = time.Since(start)
	return result, nil
}

// parseComposeFile attempts to parse a YAML file as a compose file.
// Returns nil if the file is not a valid compose file.
func (s *Scanner) parseComposeFile(
	ctx context.Context,
	path string,
) (*model.Project, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	checksum, err := fileChecksum(path)
	if err != nil {
		return nil, err
	}

	s.mu.RLock()
	cached, exists := s.cache[path]
	s.mu.RUnlock()

	if exists && cached.ModTime.Equal(info.ModTime()) &&
		cached.CheckSum == checksum {
		return cached.Project, nil
	}

	projectName := deriveProjectName(path)

	oldStderr := os.Stderr
	devNull, devNullErr := os.OpenFile(os.DevNull, os.O_WRONLY, 0)
	if devNullErr == nil {
		os.Stderr = devNull
	}

	opts, err := cli.NewProjectOptions(
		[]string{path},
		cli.WithName(projectName),
		cli.WithResolvedPaths(true),
		cli.WithInterpolation(true),
		cli.WithProfiles([]string{}),
	)

	os.Stderr = oldStderr
	if devNull != nil {
		devNull.Close()
	}

	if err != nil {
		return nil, err
	}

	os.Stderr = devNull
	if devNullErr == nil {
		devNull, _ = os.OpenFile(os.DevNull, os.O_WRONLY, 0)
	}

	composeProject, err := opts.LoadProject(ctx)

	os.Stderr = oldStderr
	if devNull != nil {
		devNull.Close()
	}
	if err != nil {
		return nil, err
	}

	if len(composeProject.Services) == 0 {
		return nil, nil
	}

	services := make([]string, 0, len(composeProject.Services))
	for _, svc := range composeProject.Services {
		services = append(services, svc.Name)
	}

	proj := &model.Project{
		ID:              generateProjectID(path),
		Name:            projectName,
		Path:            filepath.Dir(path),
		ComposeFile:     filepath.Base(path),
		ComposeFilePath: path,
		Environment:     detectEnvironment(path),
		Status:          model.StatusUnknown,
		Services:        services,
		Containers:      make([]model.Container, 0),
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	s.mu.Lock()
	s.cache[path] = &CachedProject{
		Project:  proj,
		ModTime:  info.ModTime(),
		CheckSum: checksum,
	}
	s.mu.Unlock()

	return proj, nil
}

// GetPaths returns the configured scan paths.
func (s *Scanner) GetPaths() []string {
	return s.paths
}

// SetPaths updates the scan paths.
func (s *Scanner) SetPaths(paths []string) {
	s.mu.Lock()
	s.paths = paths
	s.mu.Unlock()
}

// ClearCache removes all cached projects.
func (s *Scanner) ClearCache() {
	s.mu.Lock()
	s.cache = make(map[string]*CachedProject)
	s.mu.Unlock()
}

func defaultExcludes() []string {
	return []string{
		"node_modules",
		".git",
		"vendor",
		"__pycache__",
		".venv",
		"venv",
		".cache",
		".npm",
		".yarn",
		"dist",
		"build",
		".next",
		".nuxt",
		"target",
	}
}

func (s *Scanner) shouldExcludeDir(name string) bool {
	if strings.HasPrefix(name, ".") && name != "." && name != ".." {
		for _, exc := range s.exclude {
			if name == exc {
				return true
			}
		}
		if name != ".docker" && name != ".devcontainer" {
			return true
		}
	}

	for _, exc := range s.exclude {
		if name == exc {
			return true
		}
	}

	return false
}

func isYAMLFile(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	return ext == ".yml" || ext == ".yaml"
}

func expandPath(path string) string {
	if strings.HasPrefix(path, "~/") {
		home, err := os.UserHomeDir()
		if err == nil {
			return filepath.Join(home, path[2:])
		}
	}
	return path
}

func deriveProjectName(composePath string) string {
	dir := filepath.Dir(composePath)
	name := filepath.Base(dir)
	return sanitizeProjectName(name)
}

func sanitizeProjectName(name string) string {
	name = strings.ToLower(name)
	name = strings.ReplaceAll(name, ".", "-")

	var result strings.Builder
	for i, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			result.WriteRune(r)
		} else {
			result.WriteRune('-')
		}

		if i == 0 && !(r >= 'a' && r <= 'z') && !(r >= '0' && r <= '9') {
			result.Reset()
			result.WriteRune('p')
			result.WriteRune('-')
		}
	}

	sanitized := result.String()
	sanitized = strings.Trim(sanitized, "-_")

	if sanitized == "" {
		return "project"
	}

	return sanitized
}

func generateProjectID(composePath string) string {
	hash := sha256.Sum256([]byte(composePath))
	return hex.EncodeToString(hash[:8])
}

func fileChecksum(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:]), nil
}
