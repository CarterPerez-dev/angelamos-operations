/*
AngelaMos | 2026
compose.go
*/

package docker

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type ComposeResult struct {
	Success bool   `json:"success"`
	Output  string `json:"output"`
	Error   string `json:"error,omitempty"`
}

/*
ComposeUp starts services defined in a compose file.
Equivalent to: docker compose -f <file> up -d
*/
func ComposeUp(
	ctx context.Context,
	composePath string,
) (*ComposeResult, error) {
	return runComposeCommand(ctx, composePath, "up", "-d", "--remove-orphans")
}

/*
ComposeDown stops and removes services defined in a compose file.
Equivalent to: docker compose -f <file> down
*/
func ComposeDown(
	ctx context.Context,
	composePath string,
) (*ComposeResult, error) {
	return runComposeCommand(ctx, composePath, "down")
}

/*
ComposeRestart restarts services defined in a compose file.
*/
func ComposeRestart(
	ctx context.Context,
	composePath string,
) (*ComposeResult, error) {
	return runComposeCommand(ctx, composePath, "restart")
}

/*
ComposePull pulls latest images for services defined in a compose file.
*/
func ComposePull(
	ctx context.Context,
	composePath string,
) (*ComposeResult, error) {
	return runComposeCommand(ctx, composePath, "pull")
}

/*
ComposePs lists containers for a compose project.
*/
func ComposePs(
	ctx context.Context,
	composePath string,
) (*ComposeResult, error) {
	return runComposeCommand(ctx, composePath, "ps", "--format", "json")
}

/*
ComposeLogs gets logs from compose services.
*/
func ComposeLogs(
	ctx context.Context,
	composePath, tail string,
) (*ComposeResult, error) {
	if tail == "" {
		tail = "100"
	}
	return runComposeCommand(
		ctx,
		composePath,
		"logs",
		"--tail",
		tail,
		"--no-color",
	)
}

/*
ComposeConfig validates and returns the compose configuration.
*/
func ComposeConfig(
	ctx context.Context,
	composePath string,
) (*ComposeResult, error) {
	return runComposeCommand(ctx, composePath, "config")
}

func runComposeCommand(
	ctx context.Context,
	composePath string,
	args ...string,
) (*ComposeResult, error) {
	dir := filepath.Dir(composePath)
	file := filepath.Base(composePath)

	cmdArgs := []string{"compose", "-f", file}
	cmdArgs = append(cmdArgs, args...)

	cmd := exec.CommandContext(ctx, "docker", cmdArgs...)
	cmd.Dir = dir

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	result := &ComposeResult{
		Success: err == nil,
		Output:  strings.TrimSpace(stdout.String()),
		Error:   strings.TrimSpace(stderr.String()),
	}

	if err != nil {
		if result.Error == "" {
			result.Error = err.Error()
		}
		return result, fmt.Errorf("compose command failed: %w", err)
	}

	return result, nil
}

/*
GetComposeProjectName extracts the actual project name from a compose file.
Uses docker compose config to get the resolved project name.
*/
func GetComposeProjectName(composePath string) string {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cmd := exec.CommandContext(
		ctx,
		"docker",
		"compose",
		"-f",
		composePath,
		"config",
		"--format",
		"json",
	)

	output, err := cmd.Output()
	if err != nil {
		dir := filepath.Dir(composePath)
		return filepath.Base(dir)
	}

	var config struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(output, &config); err != nil {
		dir := filepath.Dir(composePath)
		return filepath.Base(dir)
	}

	if config.Name == "" {
		dir := filepath.Dir(composePath)
		return filepath.Base(dir)
	}

	return config.Name
}

/*
IsComposeInstalled checks if docker compose is available.
*/
func IsComposeInstalled(ctx context.Context) bool {
	cmd := exec.CommandContext(ctx, "docker", "compose", "version")
	return cmd.Run() == nil
}
