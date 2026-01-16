/*
AngelaMos | 2026
logs.go
*/

package docker

import (
	"bytes"
	"context"
	"fmt"
	"io"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/pkg/stdcopy"
)

type LogOutput struct {
	Stdout string `json:"stdout"`
	Stderr string `json:"stderr"`
}

type LogOptions struct {
	Tail       string
	Since      string
	Until      string
	Timestamps bool
	Follow     bool
}

// GetLogs retrieves logs from a container with proper stdout/stderr demultiplexing.
// Non-TTY containers multiplex streams with header bytes that must be separated.
func (c *Client) GetLogs(
	ctx context.Context,
	containerID string,
	opts LogOptions,
) (*LogOutput, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	logOpts := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Timestamps: opts.Timestamps,
		Follow:     false,
		Tail:       opts.Tail,
		Since:      opts.Since,
		Until:      opts.Until,
	}

	if logOpts.Tail == "" {
		logOpts.Tail = "100"
	}

	reader, err := c.cli.ContainerLogs(ctx, containerID, logOpts)
	if err != nil {
		return nil, fmt.Errorf("getting logs for %s: %w", containerID, err)
	}
	defer func() { _ = reader.Close() }()

	info, err := c.cli.ContainerInspect(ctx, containerID)
	if err != nil {
		return nil, fmt.Errorf(
			"inspecting container %s for TTY check: %w",
			containerID,
			err,
		)
	}

	var stdoutBuf, stderrBuf bytes.Buffer

	if info.Config != nil && info.Config.Tty {
		if _, err := io.Copy(&stdoutBuf, reader); err != nil {
			return nil, fmt.Errorf("reading TTY logs: %w", err)
		}
	} else {
		if _, err := stdcopy.StdCopy(&stdoutBuf, &stderrBuf, reader); err != nil {
			return nil, fmt.Errorf("demultiplexing logs: %w", err)
		}
	}

	return &LogOutput{
		Stdout: stdoutBuf.String(),
		Stderr: stderrBuf.String(),
	}, nil
}

// StreamLogs streams logs from a container in real-time.
// Returns separate channels for stdout and stderr.
func (c *Client) StreamLogs(
	ctx context.Context,
	containerID string,
	opts LogOptions,
) (<-chan string, <-chan string, <-chan error) {
	stdoutCh := make(chan string, 100)
	stderrCh := make(chan string, 100)
	errCh := make(chan error, 1)

	go func() {
		defer close(stdoutCh)
		defer close(stderrCh)
		defer close(errCh)

		c.mu.RLock()
		cli := c.cli
		c.mu.RUnlock()

		logOpts := container.LogsOptions{
			ShowStdout: true,
			ShowStderr: true,
			Timestamps: opts.Timestamps,
			Follow:     true,
			Tail:       opts.Tail,
			Since:      opts.Since,
		}

		if logOpts.Tail == "" {
			logOpts.Tail = "50"
		}

		reader, err := cli.ContainerLogs(ctx, containerID, logOpts)
		if err != nil {
			errCh <- fmt.Errorf("streaming logs for %s: %w", containerID, err)
			return
		}
		defer func() { _ = reader.Close() }()

		info, err := cli.ContainerInspect(ctx, containerID)
		if err != nil {
			errCh <- fmt.Errorf("inspecting container for TTY: %w", err)
			return
		}

		isTTY := info.Config != nil && info.Config.Tty

		if isTTY {
			streamTTYLogs(ctx, reader, stdoutCh)
		} else {
			streamMultiplexedLogs(ctx, reader, stdoutCh, stderrCh)
		}
	}()

	return stdoutCh, stderrCh, errCh
}

func streamTTYLogs(
	ctx context.Context,
	reader io.Reader,
	stdoutCh chan<- string,
) {
	buf := make([]byte, 4096)
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		n, err := reader.Read(buf)
		if n > 0 {
			select {
			case stdoutCh <- string(buf[:n]):
			case <-ctx.Done():
				return
			}
		}
		if err != nil {
			return
		}
	}
}

func streamMultiplexedLogs(
	ctx context.Context,
	reader io.Reader,
	stdoutCh, stderrCh chan<- string,
) {
	stdoutPR, stdoutPW := io.Pipe()
	stderrPR, stderrPW := io.Pipe()

	go func() {
		defer func() { _ = stdoutPW.Close() }()
		defer func() { _ = stderrPW.Close() }()
		_, _ = stdcopy.StdCopy(stdoutPW, stderrPW, reader)
	}()

	done := make(chan struct{})

	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := stdoutPR.Read(buf)
			if n > 0 {
				select {
				case stdoutCh <- string(buf[:n]):
				case <-ctx.Done():
					return
				}
			}
			if err != nil {
				return
			}
		}
	}()

	go func() {
		defer close(done)
		buf := make([]byte, 4096)
		for {
			n, err := stderrPR.Read(buf)
			if n > 0 {
				select {
				case stderrCh <- string(buf[:n]):
				case <-ctx.Done():
					return
				}
			}
			if err != nil {
				return
			}
		}
	}()

	select {
	case <-ctx.Done():
	case <-done:
	}
}
