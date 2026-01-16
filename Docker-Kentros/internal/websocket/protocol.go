/*
AngelaMos | 2026
protocol.go
*/

package websocket

import (
	"log/slog"
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/carterperez-dev/holophyly/internal/project"
)

type MessageType string

const (
	MsgProjectList    MessageType = "project_list"
	MsgProjectStatus  MessageType = "project_status"
	MsgContainerStats MessageType = "container_stats"
	MsgContainerLogs  MessageType = "container_logs"
	MsgSubscribe      MessageType = "subscribe"
	MsgUnsubscribe    MessageType = "unsubscribe"
	MsgError          MessageType = "error"
)

type Message struct {
	Type      MessageType `json:"type"`
	ProjectID string      `json:"project_id,omitempty"`
	Payload   any         `json:"payload,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type HTTPHandler struct {
	hub     *Hub
	manager *project.Manager
	logger  *slog.Logger
}

// NewHTTPHandler creates an HTTP handler for WebSocket upgrades.
func NewHTTPHandler(
	hub *Hub,
	manager *project.Manager,
	logger *slog.Logger,
) *HTTPHandler {
	return &HTTPHandler{
		hub:     hub,
		manager: manager,
		logger:  logger,
	}
}

// HandleWebSocket upgrades HTTP connections to WebSocket.
func (h *HTTPHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		h.logger.Error("failed to upgrade websocket", "error", err)
		return
	}

	client := NewClient(h.hub, conn, h.logger)
	h.hub.Register(client)

	go client.WritePump()
	go client.ReadPump()
}
