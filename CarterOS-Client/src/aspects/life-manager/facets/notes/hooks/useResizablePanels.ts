// ===================
// © AngelaMos | 2026
// useResizablePanels.ts
// ===================

import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'notes-panel-widths'
const DEFAULT_WIDTHS = { sidebar: 200, notesList: 280 }
const MIN_SIDEBAR = 120
const MAX_SIDEBAR = 350
const MIN_NOTES = 140
const MAX_NOTES = 500

function loadWidths(): { sidebar: number; notesList: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_WIDTHS
}

function saveWidths(widths: { sidebar: number; notesList: number }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widths))
}

export function useResizablePanels() {
  const [panelWidths, setPanelWidths] = useState(loadWidths)
  const [dragging, setDragging] = useState<'sidebar' | 'notesList' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - containerRect.left

      if (dragging === 'sidebar') {
        const newWidth = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, x))
        setPanelWidths((prev) => {
          const updated = { ...prev, sidebar: newWidth }
          saveWidths(updated)
          return updated
        })
      } else if (dragging === 'notesList') {
        const newWidth = Math.max(
          MIN_NOTES,
          Math.min(MAX_NOTES, x - panelWidths.sidebar - 4)
        )
        setPanelWidths((prev) => {
          const updated = { ...prev, notesList: newWidth }
          saveWidths(updated)
          return updated
        })
      }
    }

    const handleMouseUp = () => {
      setDragging(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, panelWidths.sidebar])

  return {
    panelWidths,
    dragging,
    setDragging,
    containerRef,
  }
}
