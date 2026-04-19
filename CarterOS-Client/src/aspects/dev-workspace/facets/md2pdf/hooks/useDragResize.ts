// ===================
// © AngelaMos | 2026
// useDragResize.ts
// ===================

import { useState, useEffect, useCallback, useRef } from 'react'

interface DragResizeReturn {
  width: number
  isDragging: boolean
  dragBarProps: {
    onMouseDown: (e: React.MouseEvent) => void
  }
}

export function useDragResize(initialWidth?: number): DragResizeReturn {
  const [width, setWidth] = useState(initialWidth ?? window.innerWidth / 2)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    setIsDragging(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const minWidth = 200
      const maxWidth = window.innerWidth - 200
      const clamped = Math.max(minWidth, Math.min(maxWidth, e.clientX))
      setWidth(clamped)
    }

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return {
    width,
    isDragging,
    dragBarProps: { onMouseDown: handleMouseDown },
  }
}
