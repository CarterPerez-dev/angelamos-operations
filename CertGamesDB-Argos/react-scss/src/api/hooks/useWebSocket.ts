// ===================
// AngelaMos | 2026
// useWebSocket.ts
// ===================

import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { DashboardMetricsSchema, type DashboardMetrics } from '../types'

type ReadyState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'

const WebSocketMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
  timestamp: z.string(),
})

interface UseWebSocketOptions {
  enabled?: boolean
  reconnectAttempts?: number
  reconnectInterval?: number
}

interface UseWebSocketReturn {
  metrics: DashboardMetrics | null
  readyState: ReadyState
  isConnected: boolean
  reconnect: () => void
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    enabled = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [readyState, setReadyState] = useState<ReadyState>('CLOSED')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const getWsUrl = useCallback(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws'
    const host = apiUrl.replace(/^https?:\/\//, '')
    return `${wsProtocol}://${host}/ws`
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      setReadyState('OPEN')
      reconnectCountRef.current = 0
    }

    ws.onclose = () => {
      setReadyState('CLOSED')

      if (enabled && reconnectCountRef.current < reconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectCountRef.current++
          connect()
        }, reconnectInterval * Math.pow(1.5, reconnectCountRef.current))
      }
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data)
        const message = WebSocketMessageSchema.parse(raw)

        if (message.type === 'metrics') {
          const parsed = DashboardMetricsSchema.safeParse(message.payload)
          if (parsed.success) {
            setMetrics(parsed.data)
          }
        }
      } catch {
        // silently ignore parse errors
      }
    }

    setReadyState('CONNECTING')
  }, [enabled, getWsUrl, reconnectAttempts, reconnectInterval])

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    reconnectCountRef.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [enabled, connect])

  return {
    metrics,
    readyState,
    isConnected: readyState === 'OPEN',
    reconnect,
  }
}
