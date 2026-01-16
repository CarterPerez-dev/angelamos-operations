/*
AngelaMos | 2025
client.go
*/

package mongodb

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"github.com/carterperez-dev/templates/go-backend/internal/config"
)

type Client struct {
	client   *mongo.Client
	database string
}

func NewClient(ctx context.Context, cfg config.MongoConfig) (*Client, error) {
	clientOpts := options.Client().
		ApplyURI(cfg.URI).
		SetMaxPoolSize(cfg.MaxPoolSize).
		SetMinPoolSize(cfg.MinPoolSize).
		SetConnectTimeout(cfg.ConnectTimeout).
		SetServerSelectionTimeout(cfg.ConnectTimeout).
		SetRetryWrites(true).
		SetRetryReads(true)

	client, err := mongo.Connect(clientOpts)
	if err != nil {
		return nil, fmt.Errorf("mongo connect: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if err := client.Ping(pingCtx, nil); err != nil {
		return nil, fmt.Errorf("mongo ping: %w", err)
	}

	return &Client{
		client:   client,
		database: cfg.Database,
	}, nil
}

func (c *Client) Ping(ctx context.Context) error {
	return c.client.Ping(ctx, nil)
}

func (c *Client) Close(ctx context.Context) error {
	return c.client.Disconnect(ctx)
}

func (c *Client) Database(name ...string) *mongo.Database {
	if len(name) > 0 && name[0] != "" {
		return c.client.Database(name[0])
	}
	return c.client.Database(c.database)
}

func (c *Client) Client() *mongo.Client {
	return c.client
}
