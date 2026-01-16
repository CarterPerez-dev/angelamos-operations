/*
AngelaMos | 2026
client.go
*/

package websocket

import (
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

type Client struct {
	hub           *Hub
	conn          *websocket.Conn
	send          chan []byte
	subscriptions map[string]bool
	logger        *slog.Logger
	mu            sync.RWMutex
}

// NewClient creates a WebSocket client.
func NewClient(hub *Hub, conn *websocket.Conn, logger *slog.Logger) *Client {
	return &Client{
		hub:           hub,
		conn:          conn,
		send:          make(chan []byte, 256),
		subscriptions: make(map[string]bool),
		logger:        logger,
	}
}

// ReadPump handles incoming messages from the WebSocket connection.
func (c *Client) ReadPump() {
	defer func() {
		c.hub.Unregister(c)
		_ = c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(
				err,
				websocket.CloseGoingAway,
				websocket.CloseAbnormalClosure,
			) {
				c.logger.Error("websocket read error", "error", err)
			}
			break
		}

		c.handleMessage(message)
	}
}

// WritePump handles outgoing messages to the WebSocket connection.
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			n := len(c.send)
			for i := 0; i < n; i++ {
				_, _ = w.Write([]byte{'\n'})
				_, _ = w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// Subscribe adds a project to this client's subscriptions.
func (c *Client) Subscribe(projectID string) {
	c.mu.Lock()
	c.subscriptions[projectID] = true
	c.mu.Unlock()
}

// Unsubscribe removes a project from this client's subscriptions.
func (c *Client) Unsubscribe(projectID string) {
	c.mu.Lock()
	delete(c.subscriptions, projectID)
	c.mu.Unlock()
}

// IsSubscribed checks if client is subscribed to a project.
func (c *Client) IsSubscribed(projectID string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if len(c.subscriptions) == 0 {
		return true
	}

	return c.subscriptions[projectID]
}

func (c *Client) handleMessage(data []byte) {
	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		c.logger.Error("failed to parse client message", "error", err)
		return
	}

	switch msg.Type {
	case MsgSubscribe:
		if projectID, ok := msg.Payload.(string); ok {
			c.Subscribe(projectID)
		} else if ids, ok := msg.Payload.([]any); ok {
			for _, id := range ids {
				if projectID, ok := id.(string); ok {
					c.Subscribe(projectID)
				}
			}
		}

	case MsgUnsubscribe:
		if projectID, ok := msg.Payload.(string); ok {
			c.Unsubscribe(projectID)
		}
	}
}
