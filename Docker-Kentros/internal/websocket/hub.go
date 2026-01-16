/*
AngelaMos | 2026
hub.go
*/

package websocket

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
	"time"
)

type Hub struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	logger     *slog.Logger
	mu         sync.RWMutex
}

// NewHub creates a WebSocket hub for managing client connections.
func NewHub(logger *slog.Logger) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte, 256),
		logger:     logger,
	}
}

// Run starts the hub's main event loop.
// Should be run in a goroutine.
func (h *Hub) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			h.mu.Lock()
			for client := range h.clients {
				close(client.send)
				delete(h.clients, client)
			}
			h.mu.Unlock()
			return

		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			h.logger.Debug("client connected", "addr", client.conn.RemoteAddr())

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
			h.logger.Debug(
				"client disconnected",
				"addr",
				client.conn.RemoteAddr(),
			)

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Broadcast sends a message to all connected clients.
func (h *Hub) Broadcast(msg *Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		h.logger.Error("failed to marshal broadcast message", "error", err)
		return
	}

	select {
	case h.broadcast <- data:
	default:
		h.logger.Warn("broadcast channel full, dropping message")
	}
}

// BroadcastToSubscribers sends a message to clients subscribed to a specific project.
func (h *Hub) BroadcastToSubscribers(projectID string, msg *Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		h.logger.Error("failed to marshal message", "error", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if client.IsSubscribed(projectID) {
			select {
			case client.send <- data:
			default:
			}
		}
	}
}

// ClientCount returns the number of connected clients.
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// Register adds a client to the hub.
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister removes a client from the hub.
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// StartStatsStreamer begins streaming container stats to subscribed clients.
func (h *Hub) StartStatsStreamer(
	ctx context.Context,
	getStats func(context.Context) (map[string]any, error),
) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if h.ClientCount() == 0 {
				continue
			}

			stats, err := getStats(ctx)
			if err != nil {
				continue
			}

			h.Broadcast(&Message{
				Type:      MsgContainerStats,
				Payload:   stats,
				Timestamp: time.Now().Unix(),
			})
		}
	}
}
