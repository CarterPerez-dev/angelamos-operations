/*
AngelaMos | 2026
client.go
*/

package docker

import (
	"context"
	"fmt"
	"sync"

	"github.com/docker/docker/client"
)

type Client struct {
	cli *client.Client
	mu  sync.RWMutex
}

// NewClient creates a Docker client with automatic API version negotiation.
// This handles Docker version differences across different hosts.
func NewClient() (*Client, error) {
	cli, err := client.NewClientWithOpts(
		client.FromEnv,
		client.WithAPIVersionNegotiation(),
	)
	if err != nil {
		return nil, fmt.Errorf("creating docker client: %w", err)
	}

	return &Client{cli: cli}, nil
}

// Ping verifies the Docker daemon is reachable and responsive.
func (c *Client) Ping(ctx context.Context) error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	_, err := c.cli.Ping(ctx)
	if err != nil {
		return fmt.Errorf("pinging docker daemon: %w", err)
	}
	return nil
}

// Close releases the Docker client resources.
func (c *Client) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.cli != nil {
		return c.cli.Close()
	}
	return nil
}

// Raw returns the underlying Docker client for advanced operations.
// Use with caution - prefer the wrapped methods when possible.
func (c *Client) Raw() *client.Client {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.cli
}
