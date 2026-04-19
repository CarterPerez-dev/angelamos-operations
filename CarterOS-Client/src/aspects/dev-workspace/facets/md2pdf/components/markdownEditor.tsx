// ===================
// © AngelaMos | 2026
// markdownEditor.tsx
// ===================

import { useEffect, useRef } from 'react'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import styles from './markdownEditor.module.scss'

interface MarkdownEditorProps {
  initialValue: string
  onChange: (value: string) => void
  width: number
}

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
  },
  '.cm-scroller': {
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
    overflow: 'auto',
  },
  '.cm-content': {
    caretColor: '#fafafa',
    padding: '10px 0',
  },
  '.cm-gutters': {
    backgroundColor: 'hsl(0, 0%, 9%)',
    color: 'hsl(0, 0%, 30.2%)',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'hsl(0, 0%, 12.2%)',
  },
  '.cm-activeLine': {
    backgroundColor: 'hsl(0, 0%, 12.2%)',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#fafafa',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'hsl(0, 0%, 19.2%)',
  },
})

const darkHighlight = EditorView.theme({}, { dark: true })

export function MarkdownEditor({ initialValue, onChange, width }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        history(),
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
        editorTheme,
        darkHighlight,
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={styles.editor}
      style={{ width }}
    />
  )
}
