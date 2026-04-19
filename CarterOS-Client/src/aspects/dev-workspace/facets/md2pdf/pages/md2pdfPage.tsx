// ===================
// © AngelaMos | 2026
// md2pdfPage.tsx
// ===================

import { useRef, useState } from 'react'
import { DragBar, MarkdownEditor, MarkdownPreview } from '../components'
import { useDragResize } from '../hooks'
import { INITIAL_MARKDOWN } from '../types'
import styles from './md2pdfPage.module.scss'

export function Md2pdfPage() {
  const [text, setText] = useState(INITIAL_MARKDOWN)
  const { width, isDragging, dragBarProps } = useDragResize()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        setText(content)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleTransform = () => {
    const previewEl = document.querySelector('[data-md2pdf-preview]')
    const h1El = previewEl?.querySelector('h1')
    const currentTitle = document.title

    if (h1El) {
      document.title = h1El.innerText
    }

    window.print()

    window.requestAnimationFrame(() => {
      document.title = currentTitle
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.toolbar}>
        <span className={styles.title}>md2pdf</span>
        <div className={styles.actions}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            onChange={handleFileUpload}
            className={styles.fileInput}
          />
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose
          </button>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={handleTransform}
          >
            Transform
          </button>
        </div>
      </header>
      <div
        className={styles.workspace}
        style={{ userSelect: isDragging ? 'none' : 'auto' }}
      >
        <MarkdownEditor
          initialValue={INITIAL_MARKDOWN}
          onChange={setText}
          width={width}
        />
        <DragBar {...dragBarProps} isDragging={isDragging} />
        <MarkdownPreview source={text} />
      </div>
    </div>
  )
}
