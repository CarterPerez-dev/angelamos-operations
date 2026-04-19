// ===================
// © AngelaMos | 2026
// InlineEdit.tsx
// ===================

import { useEffect, useRef, useState } from 'react'
import styles from './InlineEdit.module.scss'

interface InlineEditProps {
  value: string
  onSave: (newValue: string) => void
  className?: string
  disabled?: boolean
}

export function InlineEdit({
  value,
  onSave,
  className = '',
  disabled = false,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    } else {
      setEditValue(value)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!disabled) {
      e.stopPropagation()
      setIsEditing(true)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        onClick={(e) => e.stopPropagation()}
        className={`${styles.input} ${className}`}
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      onDoubleClick={handleDoubleClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          setIsEditing(true)
        }
      }}
      className={`${styles.text} ${disabled ? styles.disabled : ''} ${className}`}
      title={disabled ? '' : 'Double-click to edit'}
    >
      {value}
    </span>
  )
}
