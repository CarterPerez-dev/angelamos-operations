// ===================
// © AngelaMos | 2025
// useDockerWebSocket.ts
// ===================

import { useEffect, useRef, useState } from 'react'
import type { ContainerStatsMap } from '../types/docker.types'
import { getDockerWSUrl } from '../types/docker.enums'

interface UseDockerWebSocketReturn {
  stats: ContainerStatsMap | null
  isConnected: boolean
  error: string | null
}

export const useDockerWebSocket = (enabled = true): UseDockerWebSocketReturn => {
  const [stats, setStats] = useState<ContainerStatsMap | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10

  useEffect(() => {
    if (!enabled) {
      return
    }

    const connect = () => {
      try {
        const wsUrl = getDockerWSUrl()
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          setIsConnected(true)
          setError(null)
          reconnectAttempts.current = 0
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)

            if (message.type === 'container_stats' && message.payload) {
              setStats(message.payload)
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
          }
        }

        ws.onerror = (event) => {
          console.error('WebSocket error:', event)
          setError('WebSocket connection error')
        }

        ws.onclose = () => {
          setIsConnected(false)
          wsRef.current = null

          if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
            reconnectAttempts.current++

            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, delay)
          } else if (reconnectAttempts.current >= maxReconnectAttempts) {
            setError('Max reconnection attempts reached')
          }
        }
      } catch (err) {
        setError('Failed to create WebSocket connection')
        console.error('WebSocket connection error:', err)
      }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [enabled])

  return {
    stats,
    isConnected,
    error,
  }
}
