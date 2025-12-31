// ===========================
// ©AngelaMos | 2025
// button.tsx
// ===========================

import { type ButtonHTMLAttributes } from 'react'
import styles from './button.module.scss'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
}
