// ===================
// © AngelaMos | 2026
// dragBar.tsx
// ===================

import styles from './dragBar.module.scss'

interface DragBarProps {
  onMouseDown: (e: React.MouseEvent) => void
  isDragging: boolean
}

export function DragBar({ onMouseDown, isDragging }: DragBarProps) {
  return (
    <div
      className={`${styles.dragBar} ${isDragging ? styles.active : ''}`}
      onMouseDown={onMouseDown}
    />
  )
}
