// ===========================
// ©AngelaMos | 2025
// card.tsx
// ===========================

import { type HTMLAttributes } from 'react'
import styles from './card.module.scss'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`${styles.card} ${interactive ? styles.interactive : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  )
}
