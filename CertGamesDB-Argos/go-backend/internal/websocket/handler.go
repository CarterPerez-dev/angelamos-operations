/*
AngelaMos | 2026
handler.go
*/

package websocket

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/coder/websocket"
	"github.com/google/uuid"
)

type Handler struct {
	hub    *Hub
	logger *slog.Logger
}

func NewHandler(hub *Hub, logger *slog.Logger) *Handler {
	return &Handler{
		hub:    hub,
		logger: logger,
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{"*"},
	})
	if err != nil {
		h.logger.Error("websocket accept failed", "error", err)
		return
	}

	clientID := uuid.New().String()[:8]

	client := &Client{
		hub:      h.hub,
		conn:     conn,
		send:     make(chan []byte, 256),
		clientID: clientID,
	}

	h.hub.register <- client

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go client.WritePump(ctx)
	client.ReadPump(ctx)
}

func (h *Handler) GetHub() *Hub {
	return h.hub
}

type MetricsBroadcaster struct {
	hub           *Hub
	metricsGetter func(ctx context.Context) (any, error)
	intervalMs    int
	logger        *slog.Logger
}

func NewMetricsBroadcaster(hub *Hub, getter func(ctx context.Context) (any, error), intervalMs int, logger *slog.Logger) *MetricsBroadcaster {
	return &MetricsBroadcaster{
		hub:           hub,
		metricsGetter: getter,
		intervalMs:    intervalMs,
		logger:        logger,
	}
}

func (b *MetricsBroadcaster) Start(ctx context.Context) {
	go b.run(ctx)
}

func (b *MetricsBroadcaster) run(ctx context.Context) {
	ticker := time.NewTicker(time.Duration(b.intervalMs) * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if b.hub.ClientCount() == 0 {
				continue
			}

			metrics, err := b.metricsGetter(ctx)
			if err != nil {
				b.logger.Error("failed to get metrics for broadcast", "error", err)
				continue
			}

			b.hub.Broadcast("metrics", metrics)
		}
	}
}
